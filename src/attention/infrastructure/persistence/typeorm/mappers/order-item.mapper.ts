import { OrderItem } from '../../../../domain/entities/order-item.entity.js';
import { OrderItemOrmEntity } from '../entities/order-item.orm-entity.js';

export class OrderItemMapper {
  static toDomain(orm: OrderItemOrmEntity): OrderItem {
    return OrderItem.fromPersistence({
      id: orm.id,
      quantity: orm.quantity,
      unitPrice: Number(orm.unitPrice),
      productName: orm.productName,
      notes: orm.notes ?? null,
      orderId: orm.orderId,
      productId: orm.productId,
      userId: orm.userId ?? null,
      customerId: orm.customerId ?? null,
      roundNumber: orm.roundNumber,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: OrderItem,
    existing?: OrderItemOrmEntity,
  ): OrderItemOrmEntity {
    const orm = existing ?? new OrderItemOrmEntity();
    orm.id = domain.id;
    orm.quantity = domain.quantity;
    orm.unitPrice = domain.unitPrice;
    orm.productName = domain.productName;
    orm.notes = domain.notes ?? undefined;
    orm.orderId = domain.orderId;
    orm.productId = domain.productId;
    orm.userId = domain.userId ?? undefined;
    orm.customerId = domain.customerId ?? undefined;
    orm.roundNumber = domain.roundNumber;
    return orm;
  }
}
