import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { Order } from '../../domain/entities/order.entity.js';
import { OrderStatus } from '../../domain/enums/order-status.enum.js';
import { AttentionNotActiveError } from '../../domain/exceptions/attention.errors.js';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.js';
import type { OrderRepository } from '../../domain/repositories/order.repository.js';
import { WorkflowStatusesService } from '../attention-settings/workflow-statuses.service.js';
import { requireAttention } from '../attentions/require-attention.js';
import { PAYMENT_LEDGER } from '../ports/payment-ledger.port.js';
import type { PaymentLedgerPort } from '../ports/payment-ledger.port.js';
import type { OrderResult } from './order-submission.service.js';
import { lockOrder, requireOrder, restaurantOfOrder } from './require-order.js';

/** Staff actions on an order once it was submitted, and order reads. */
@Injectable()
export class OrdersService {
  constructor(
    @Inject(ATTENTION_REPOSITORY)
    private readonly attentionRepository: AttentionRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    @Inject(PAYMENT_LEDGER) private readonly paymentLedger: PaymentLedgerPort,
    private readonly statuses: WorkflowStatusesService,
  ) {}

  async confirmOrder(orderId: string): Promise<Order> {
    const order = await this.findOrder(orderId);
    order.confirm(
      await this.statuses.orderCatalog(
        await restaurantOfOrder(this.attentionRepository, order),
      ),
    );
    return this.orderRepository.save(order);
  }

  /**
   * Cancels a whole order (e.g. the table changed its mind) while nothing of
   * it has been served. Its pending items are cancelled with history; the
   * attention and its other orders are left untouched.
   */
  async cancelOrder(
    orderId: string,
    input: { reason: string; changedByUserId?: string | null },
  ): Promise<OrderResult> {
    const order = await this.transactionRunner.run(async (tx) => {
      const order = await lockOrder(this.orderRepository, orderId, tx);
      const attention = await requireAttention(
        this.attentionRepository,
        order.attentionId,
        tx,
      );
      if (!attention.isActive) {
        throw new AttentionNotActiveError(attention.status);
      }
      const statuses = await this.statuses.orderCatalog(
        attention.restaurantId,
        tx,
      );
      order.cancel(statuses.defaultFor(OrderStatus.CANCELLED), {
        statuses,
        nextHistoryId: () => randomUUID(),
        reason: input.reason,
        changedByUserId: input.changedByUserId,
        paidItemIds: new Set(
          await this.paymentLedger.itemsWithPayments(order.billableItemIds),
        ),
      });
      return this.orderRepository.save(order, tx);
    });
    return { order, items: [...order.items], created: false };
  }

  findOrders(attentionId: string): Promise<Order[]> {
    return this.orderRepository.findByAttention(attentionId);
  }

  findOrder(orderId: string): Promise<Order> {
    return requireOrder(this.orderRepository, orderId);
  }
}
