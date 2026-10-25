import { Restaurant } from '../../../../domain/entities/restaurant.entity.js';
import { RestaurantOrmEntity } from '../entities/restaurant.orm-entity.js';

export class RestaurantMapper {
  static toDomain(orm: RestaurantOrmEntity): Restaurant {
    return Restaurant.fromPersistence({
      id: orm.id,
      name: orm.name,
      slug: orm.slug,
      address: orm.address ?? null,
      phone: orm.phone ?? null,
      organizationId: orm.organizationId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: Restaurant,
    existing?: RestaurantOrmEntity,
  ): RestaurantOrmEntity {
    const orm = existing ?? new RestaurantOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.slug = domain.slug;
    orm.address = domain.address ?? undefined;
    orm.phone = domain.phone ?? undefined;
    orm.organizationId = domain.organizationId;
    return orm;
  }
}
