import { Order } from '../../../../domain/entities/order.entity.js';
import { OrderOrmEntity } from '../entities/order.orm-entity.js';

export class OrderMapper {
  static toDomain(orm: OrderOrmEntity): Order {
    return Order.fromPersistence({
      id: orm.id,
      status: orm.status,
      total: Number(orm.total),
      diningTableId: orm.diningTableId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: Order, existing?: OrderOrmEntity): OrderOrmEntity {
    const orm = existing ?? new OrderOrmEntity();
    orm.id = domain.id;
    orm.status = domain.status;
    orm.total = domain.total;
    orm.diningTableId = domain.diningTableId;
    return orm;
  }
}
