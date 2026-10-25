import { OrderItem } from '../entities/order-item.entity.js';

export const ORDER_ITEM_REPOSITORY = Symbol('ORDER_ITEM_REPOSITORY');

export interface OrderItemRepository {
  findById(id: string): Promise<OrderItem | null>;
  findAll(): Promise<OrderItem[]>;
  save(orderItem: OrderItem): Promise<OrderItem>;
  delete(id: string): Promise<boolean>;
}
