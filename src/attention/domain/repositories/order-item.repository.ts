import type { Page, PageRequest } from '../../../common/application/pagination.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { OrderItem } from '../entities/order-item.entity.js';
import { OrderItemStatus } from '../enums/order-item-status.enum.js';

export const ORDER_ITEM_REPOSITORY = Symbol('ORDER_ITEM_REPOSITORY');

export interface OrderItemRepository {
  findById(id: string, tx?: TransactionContext): Promise<OrderItem | null>;
  findByOrder(orderId: string, tx?: TransactionContext): Promise<OrderItem[]>;
  findByAttention(attentionId: string): Promise<OrderItem[]>;
  /**
   * Kitchen / floor board: items of a restaurant, optionally by status. By
   * default only items of active attentions (OPEN / BILL_REQUESTED).
   */
  findForBoard(
    filter: {
      restaurantId: string;
      statuses?: OrderItemStatus[];
      includeClosedAttentions?: boolean;
    },
    page: PageRequest,
  ): Promise<Page<OrderItem>>;
  insert(item: OrderItem, tx?: TransactionContext): Promise<OrderItem>;
  /**
   * Persists a status change only if the stored version still equals
   * expectedVersion (optimistic lock). Returns false when it doesn't.
   */
  updateStatus(
    item: OrderItem,
    expectedVersion: number,
    tx?: TransactionContext,
  ): Promise<boolean>;
}
