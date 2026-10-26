import { RestaurantOrderMode } from '../../../../domain/entities/restaurant-order-mode.entity.js';
import { RestaurantOrderModeOrmEntity } from '../entities/restaurant-order-mode.orm-entity.js';

export class RestaurantOrderModeMapper {
  static toDomain(orm: RestaurantOrderModeOrmEntity): RestaurantOrderMode {
    return RestaurantOrderMode.fromPersistence({
      restaurantId: orm.restaurantId,
      mode: orm.mode,
      isEnabled: orm.isEnabled,
      minimumAmount: orm.minimumAmount,
      deliveryFee: orm.deliveryFee,
      configuration: orm.configurationJson,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: RestaurantOrderMode,
    existing?: RestaurantOrderModeOrmEntity,
  ): RestaurantOrderModeOrmEntity {
    const orm = existing ?? new RestaurantOrderModeOrmEntity();
    orm.restaurantId = domain.restaurantId;
    orm.mode = domain.mode;
    orm.isEnabled = domain.isEnabled;
    orm.minimumAmount = domain.minimumAmount;
    orm.deliveryFee = domain.deliveryFee;
    orm.configurationJson = domain.configuration;
    return orm;
  }
}
