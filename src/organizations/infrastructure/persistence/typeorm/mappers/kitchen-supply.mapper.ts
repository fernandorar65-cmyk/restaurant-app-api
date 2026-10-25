import { KitchenSupply } from '../../../../domain/entities/kitchen-supply.entity.js';
import { KitchenSupplyOrmEntity } from '../entities/kitchen-supply.orm-entity.js';

export class KitchenSupplyMapper {
  static toDomain(orm: KitchenSupplyOrmEntity): KitchenSupply {
    return KitchenSupply.fromPersistence({
      id: orm.id,
      name: orm.name,
      unit: orm.unit,
      quantity: Number(orm.quantity),
      restaurantId: orm.restaurantId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: KitchenSupply,
    existing?: KitchenSupplyOrmEntity,
  ): KitchenSupplyOrmEntity {
    const orm = existing ?? new KitchenSupplyOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.unit = domain.unit;
    orm.quantity = domain.quantity;
    orm.restaurantId = domain.restaurantId;
    return orm;
  }
}
