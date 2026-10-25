import { Order } from '../entities/order.entity.js';
import { OrderStatus } from '../entities/order-status.enum.js';
import type { TransactionContext } from '../transaction-context.js';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderRepository {
  findById(id: string, tx?: TransactionContext): Promise<Order | null>;
  findOpenByDiningTableId(
    diningTableId: string,
    openStatuses: OrderStatus[],
  ): Promise<Order | null>;
  findAll(): Promise<Order[]>;
  save(order: Order, tx?: TransactionContext): Promise<Order>;
  delete(id: string): Promise<boolean>;
}
