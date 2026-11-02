import { OrderItemStatusHistory } from '../entities/order-item-status-history.entity.js';

export const ORDER_ITEM_STATUS_HISTORY_REPOSITORY = Symbol(
  'ORDER_ITEM_STATUS_HISTORY_REPOSITORY',
);

export interface OrderItemStatusHistoryRepository {
  findByItem(orderItemId: string): Promise<OrderItemStatusHistory[]>;
  /** History of several items, oldest first. */
  findByItems(orderItemIds: string[]): Promise<OrderItemStatusHistory[]>;
}
