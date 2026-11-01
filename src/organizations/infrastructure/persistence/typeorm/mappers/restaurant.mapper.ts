import { CurrencyCode } from '../../../../../common/domain/value-objects/currency-code.js';
import { Email } from '../../../../../common/domain/value-objects/email.js';
import { GeoCoordinates } from '../../../../../common/domain/value-objects/geo-coordinates.js';
import { TimeZone } from '../../../../../common/domain/value-objects/time-zone.js';
import { Restaurant } from '../../../../domain/entities/restaurant.entity.js';
import { RestaurantOrmEntity } from '../entities/restaurant.orm-entity.js';

export class RestaurantMapper {
  static toDomain(orm: RestaurantOrmEntity): Restaurant {
    return Restaurant.fromPersistence({
      id: orm.id,
      organizationId: orm.organizationId,
      code: orm.code,
      slug: orm.slug,
      name: orm.name,
      description: orm.description,
      address: orm.address,
      phone: orm.phone,
      email: orm.email ? Email.rehydrate(orm.email) : null,
      location: GeoCoordinates.rehydrate(orm.latitude, orm.longitude),
      currencyCode: CurrencyCode.rehydrate(orm.currencyCode),
      timezone: TimeZone.rehydrate(orm.timezone),
      status: orm.status,
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
    orm.organizationId = domain.organizationId;
    orm.code = domain.code;
    orm.slug = domain.slug;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.address = domain.address;
    orm.phone = domain.phone;
    orm.email = domain.email;
    orm.latitude = domain.latitude;
    orm.longitude = domain.longitude;
    orm.currencyCode = domain.currencyCode;
    orm.timezone = domain.timezone;
    orm.status = domain.status;
    return orm;
  }
}
