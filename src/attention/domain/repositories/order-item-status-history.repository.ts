import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { OrderItemStatusHistory } from '../entities/order-item-status-history.entity.js';

export const ORDER_ITEM_STATUS_HISTORY_REPOSITORY = Symbol(
  'ORDER_ITEM_STATUS_HISTORY_REPOSITORY',
);

export interface OrderItemStatusHistoryRepository {
  findByItem(orderItemId: string): Promise<OrderItemStatusHistory[]>;
  save(
    entry: OrderItemStatusHistory,
    tx?: TransactionContext,
  ): Promise<OrderItemStatusHistory>;
}
