import { OrderStatusHistory } from '../entities/order-status-history.entity.js';
import type { TransactionContext } from '../transaction-context.js';

export const ORDER_STATUS_HISTORY_REPOSITORY = Symbol(
  'ORDER_STATUS_HISTORY_REPOSITORY',
);

export interface OrderStatusHistoryRepository {
  findById(id: string): Promise<OrderStatusHistory | null>;
  findAll(): Promise<OrderStatusHistory[]>;
  save(
    entry: OrderStatusHistory,
    tx?: TransactionContext,
  ): Promise<OrderStatusHistory>;
  delete(id: string): Promise<boolean>;
}
