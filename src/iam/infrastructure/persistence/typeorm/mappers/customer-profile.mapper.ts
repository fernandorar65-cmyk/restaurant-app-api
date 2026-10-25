import { CustomerProfile } from '../../../../domain/entities/customer-profile.entity.js';
import { CustomerProfileOrmEntity } from '../entities/customer-profile.orm-entity.js';

export class CustomerProfileMapper {
  static toDomain(orm: CustomerProfileOrmEntity): CustomerProfile {
    return CustomerProfile.fromPersistence({
      userId: orm.userId,
      dietaryPreferences: orm.dietaryPreferences,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: CustomerProfile,
    existing?: CustomerProfileOrmEntity,
  ): CustomerProfileOrmEntity {
    const orm = existing ?? new CustomerProfileOrmEntity();
    orm.userId = domain.userId;
    orm.dietaryPreferences = domain.dietaryPreferences;
    return orm;
  }
}
