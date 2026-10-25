import { OrderStatusHistory } from '../../../../domain/entities/order-status-history.entity.js';
import { OrderStatusHistoryOrmEntity } from '../entities/order-status-history.orm-entity.js';

export class OrderStatusHistoryMapper {
  static toDomain(orm: OrderStatusHistoryOrmEntity): OrderStatusHistory {
    return OrderStatusHistory.fromPersistence({
      id: orm.id,
      status: orm.status,
      notes: orm.notes ?? null,
      orderId: orm.orderId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: OrderStatusHistory,
    existing?: OrderStatusHistoryOrmEntity,
  ): OrderStatusHistoryOrmEntity {
    const orm = existing ?? new OrderStatusHistoryOrmEntity();
    orm.id = domain.id;
    orm.status = domain.status;
    orm.notes = domain.notes ?? undefined;
    orm.orderId = domain.orderId;
    return orm;
  }
}
