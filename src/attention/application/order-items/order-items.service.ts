import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Page, PageRequest } from '../../../common/domain/pagination.js';
import { EVENT_BUS } from '../../../common/application/ports/event-bus.port.js';
import type { EventBus } from '../../../common/application/ports/event-bus.port.js';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { OrderItemStatusHistory } from '../../domain/entities/order-item-status-history.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { Order } from '../../domain/entities/order.entity.js';
import { OrderStatus } from '../../domain/enums/order-status.enum.js';
import { OrderItemPreparationStarted } from '../../domain/events/order-item-preparation-started.event.js';
import { InvalidServiceSetupError } from '../../domain/exceptions/attention.errors.js';
import { OrderItemNotFoundError } from '../../domain/exceptions/attention.errors.js';
import { ORDER_ITEM_STATUS_HISTORY_REPOSITORY } from '../../domain/repositories/order-item-status-history.repository.js';
import type { OrderItemStatusHistoryRepository } from '../../domain/repositories/order-item-status-history.repository.js';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';
import { ORDER_ITEM_REPOSITORY } from '../../domain/repositories/order-item.repository.js';
import type { OrderItemRepository } from '../../domain/repositories/order-item.repository.js';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.js';
import type { OrderRepository } from '../../domain/repositories/order.repository.js';
import { WorkflowStatusesService } from '../attention-settings/workflow-statuses.service.js';
import { lockOrder, restaurantOfOrder } from '../orders/require-order.js';
import { PAYMENT_LEDGER } from '../ports/payment-ledger.port.js';
import type { PaymentLedgerPort } from '../ports/payment-ledger.port.js';

export interface ChangeOrderItemStatusInput {
  /** One of the restaurant's order statuses... */
  statusId?: string | null;
  /** ...or its first active status of this canonical state. */
  status?: OrderStatus | null;
  /**
   * Version the caller read. If someone else changed the item since then,
   * the change is rejected instead of silently overwriting theirs.
   */
  expectedVersion?: number;
  reason?: string | null;
  changedByUserId?: string | null;
}

@Injectable()
export class OrderItemsService {
  constructor(
    @Inject(ORDER_ITEM_REPOSITORY)
    private readonly itemRepository: OrderItemRepository,
    @Inject(ORDER_ITEM_STATUS_HISTORY_REPOSITORY)
    private readonly historyRepository: OrderItemStatusHistoryRepository,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(ATTENTION_REPOSITORY)
    private readonly attentionRepository: AttentionRepository,
    @Inject(PAYMENT_LEDGER) private readonly paymentLedger: PaymentLedgerPort,
    private readonly statuses: WorkflowStatusesService,
  ) {}

  async findOne(id: string): Promise<OrderItem> {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new OrderItemNotFoundError(id);
    }
    return item;
  }

  findByAttention(attentionId: string): Promise<OrderItem[]> {
    return this.itemRepository.findByAttention(attentionId);
  }

  findForBoard(
    filter: {
      restaurantId: string;
      statuses?: OrderStatus[];
      includeClosedAttentions?: boolean;
    },
    page: PageRequest,
  ): Promise<Page<OrderItem>> {
    return this.itemRepository.findForBoard(filter, page);
  }

  async history(id: string): Promise<OrderItemStatusHistory[]> {
    await this.findOne(id);
    return this.historyRepository.findByItem(id);
  }

  /**
   * Applies a transition and writes its history entry atomically, keeping the
   * status of its order in sync. The attention status is never touched. The
   * target must be an active status of the item's own restaurant.
   */
  async changeStatus(
    id: string,
    input: ChangeOrderItemStatusInput,
  ): Promise<OrderItem> {
    if (!input.statusId && !input.status) {
      throw new InvalidServiceSetupError(
        'Indica el estado destino (statusId o status)',
      );
    }
    const previous = await this.transactionRunner.run(async (tx) => {
      const item = await this.itemRepository.findById(id, tx);
      if (!item) {
        throw new OrderItemNotFoundError(id);
      }
      // Every item change locks its order first, so item changes and order
      // cancellations always lock in the same order and never deadlock.
      const order = await lockOrder(this.orderRepository, item.orderId, tx);
      const statuses = await this.statuses.orderCatalog(
        await restaurantOfOrder(this.attentionRepository, order, tx),
        tx,
      );
      const target = input.statusId
        ? statuses.require(input.statusId)
        : statuses.defaultFor(input.status as OrderStatus);
      const from = order.changeItemStatus(id, target, {
        historyId: randomUUID(),
        statuses,
        expectedVersion: input.expectedVersion,
        reason: input.reason,
        changedByUserId: input.changedByUserId,
        paidItemIds: Order.dropsFromBill(target)
          ? new Set(await this.paymentLedger.itemsWithPayments([id]))
          : undefined,
      });
      await this.orderRepository.save(order, tx);
      return from;
    });
    const item = await this.findOne(id);
    // Only when the item enters preparation, not when it moves between the
    // restaurant's own preparation statuses. Published after the commit, so
    // its subscribers can't undo the status change.
    if (
      previous !== OrderStatus.IN_PREPARATION &&
      item.currentStatus === OrderStatus.IN_PREPARATION
    ) {
      await this.eventBus.publish(
        new OrderItemPreparationStarted(
          item.id,
          item.productId,
          item.quantity,
          input.changedByUserId ?? null,
        ),
      );
    }
    return item;
  }
}
