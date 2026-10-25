import { OrderItem } from '../entities/order-item.entity.js';
import type { TransactionContext } from '../transaction-context.js';

export const ORDER_ITEM_REPOSITORY = Symbol('ORDER_ITEM_REPOSITORY');

export interface OrderItemRepository {
  findById(id: string): Promise<OrderItem | null>;
  findAll(): Promise<OrderItem[]>;
  findByOrderId(
    orderId: string,
    tx?: TransactionContext,
  ): Promise<OrderItem[]>;
  save(orderItem: OrderItem, tx?: TransactionContext): Promise<OrderItem>;
  delete(id: string, tx?: TransactionContext): Promise<boolean>;
}
