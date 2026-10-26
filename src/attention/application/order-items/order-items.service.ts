import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { OrderItemStatusHistory } from '../../domain/entities/order-item-status-history.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { OrderItemStatus } from '../../domain/enums/order-item-status.enum.js';
import {
  OrderItemNotFoundError,
  StaleOrderItemVersionError,
} from '../../domain/exceptions/attention.errors.js';
import { ORDER_ITEM_STATUS_HISTORY_REPOSITORY } from '../../domain/repositories/order-item-status-history.repository.js';
import type { OrderItemStatusHistoryRepository } from '../../domain/repositories/order-item-status-history.repository.js';
import { ORDER_ITEM_REPOSITORY } from '../../domain/repositories/order-item.repository.js';
import type { OrderItemRepository } from '../../domain/repositories/order-item.repository.js';
import { STOCK_CONSUMPTION } from '../ports/stock-consumption.port.js';
import type { StockConsumptionPort } from '../ports/stock-consumption.port.js';

export interface ChangeOrderItemStatusInput {
  status: OrderItemStatus;
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
  private readonly logger = new Logger(OrderItemsService.name);

  constructor(
    @Inject(ORDER_ITEM_REPOSITORY)
    private readonly itemRepository: OrderItemRepository,
    @Inject(ORDER_ITEM_STATUS_HISTORY_REPOSITORY)
    private readonly historyRepository: OrderItemStatusHistoryRepository,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    @Inject(STOCK_CONSUMPTION)
    private readonly stockConsumption: StockConsumptionPort,
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
      statuses?: OrderItemStatus[];
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

  /** Applies a transition and writes its history entry atomically. */
  async changeStatus(
    id: string,
    input: ChangeOrderItemStatusInput,
  ): Promise<OrderItem> {
    await this.transactionRunner.run(async (tx) => {
      const item = await this.itemRepository.findById(id, tx);
      if (!item) {
        throw new OrderItemNotFoundError(id);
      }
      const expectedVersion = input.expectedVersion ?? item.version;
      if (expectedVersion !== item.version) {
        throw new StaleOrderItemVersionError(id);
      }
      const entry = item.changeStatus(input.status, {
        historyId: randomUUID(),
        reason: input.reason,
        changedByUserId: input.changedByUserId,
      });
      const updated = await this.itemRepository.updateStatus(
        item,
        expectedVersion,
        tx,
      );
      if (!updated) {
        throw new StaleOrderItemVersionError(id);
      }
      await this.historyRepository.save(entry, tx);
    });
    const item = await this.findOne(id);
    if (item.currentStatus === OrderItemStatus.PREPARING) {
      await this.consumeStock(item, input.changedByUserId);
    }
    return item;
  }

  /**
   * Runs after the status change is committed: a stock problem must never
   * undo or block the kitchen flow, so failures are logged, not thrown.
   */
  private async consumeStock(
    item: OrderItem,
    changedByUserId?: string | null,
  ): Promise<void> {
    try {
      await this.stockConsumption.consumeForOrderItem({
        orderItemId: item.id,
        productId: item.productId,
        quantity: item.quantity,
        changedByUserId,
      });
    } catch (error) {
      this.logger.error(
        `Could not discount stock for order item ${item.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
