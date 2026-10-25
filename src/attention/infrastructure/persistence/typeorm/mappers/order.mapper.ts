import { Order } from '../../../../domain/entities/order.entity.js';
import { OrderOrmEntity } from '../entities/order.orm-entity.js';

export class OrderMapper {
  static toDomain(orm: OrderOrmEntity): Order {
    return Order.fromPersistence({
      id: orm.id,
      code: orm.code,
      status: orm.status,
      total: Number(orm.total),
      fulfillmentType: orm.fulfillmentType,
      diningTableId: orm.diningTableId,
      deliveryAddress: orm.deliveryAddress,
      customerId: orm.customerId,
      guestToken: orm.guestToken,
      billRequestedAt: orm.billRequestedAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: Order, existing?: OrderOrmEntity): OrderOrmEntity {
    const orm = existing ?? new OrderOrmEntity();
    orm.id = domain.id;
    orm.code = domain.code;
    orm.status = domain.status;
    orm.total = domain.total;
    orm.fulfillmentType = domain.fulfillmentType;
    orm.diningTableId = domain.diningTableId;
    orm.deliveryAddress = domain.deliveryAddress;
    orm.customerId = domain.customerId;
    orm.guestToken = domain.guestToken;
    orm.billRequestedAt = domain.billRequestedAt;
    return orm;
  }
}
