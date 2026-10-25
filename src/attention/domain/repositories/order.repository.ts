import { Order } from '../entities/order.entity.js';
import type { TransactionContext } from '../transaction-context.js';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findAll(): Promise<Order[]>;
  save(order: Order, tx?: TransactionContext): Promise<Order>;
  delete(id: string): Promise<boolean>;
}
