import { RestaurantFloor } from '../../../../domain/entities/restaurant-floor.entity.js';
import { RestaurantFloorOrmEntity } from '../entities/restaurant-floor.orm-entity.js';

export class RestaurantFloorMapper {
  static toDomain(orm: RestaurantFloorOrmEntity): RestaurantFloor {
    return RestaurantFloor.fromPersistence({
      id: orm.id,
      restaurantId: orm.restaurantId,
      name: orm.name,
      sortOrder: orm.sortOrder,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: RestaurantFloor,
    existing?: RestaurantFloorOrmEntity,
  ): RestaurantFloorOrmEntity {
    const orm = existing ?? new RestaurantFloorOrmEntity();
    orm.id = domain.id;
    orm.restaurantId = domain.restaurantId;
    orm.name = domain.name;
    orm.sortOrder = domain.sortOrder;
    orm.isActive = domain.isActive;
    return orm;
  }
}
