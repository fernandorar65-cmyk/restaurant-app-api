import { Inject, Injectable } from '@nestjs/common';
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
  constructor(
    @Inject(ORDER_ITEM_REPOSITORY)
    private readonly itemRepository: OrderItemRepository,
    @Inject(ORDER_ITEM_STATUS_HISTORY_REPOSITORY)
    private readonly historyRepository: OrderItemStatusHistoryRepository,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
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

  findForRestaurant(
    restaurantId: string,
    statuses?: OrderItemStatus[],
  ): Promise<OrderItem[]> {
    return this.itemRepository.findByRestaurant(restaurantId, statuses);
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
    return this.findOne(id);
  }
}
