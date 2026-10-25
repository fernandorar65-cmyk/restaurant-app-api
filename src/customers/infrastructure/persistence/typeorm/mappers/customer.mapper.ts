import { Customer } from '../../../../domain/entities/customer.entity.js';
import { CustomerOrmEntity } from '../entities/customer.orm-entity.js';

export class CustomerMapper {
  static toDomain(orm: CustomerOrmEntity): Customer {
    return Customer.fromPersistence({
      id: orm.id,
      name: orm.name,
      email: orm.email,
      passwordHash: orm.passwordHash,
      phone: orm.phone ?? null,
      marketingOptIn: orm.marketingOptIn,
      resetPasswordTokenHash: orm.resetPasswordTokenHash,
      resetPasswordExpiresAt: orm.resetPasswordExpiresAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: Customer,
    existing?: CustomerOrmEntity,
  ): CustomerOrmEntity {
    const orm = existing ?? new CustomerOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.email = domain.email;
    orm.passwordHash = domain.passwordHash;
    orm.phone = domain.phone ?? undefined;
    orm.marketingOptIn = domain.marketingOptIn;
    orm.resetPasswordTokenHash = domain.resetPasswordTokenHash;
    orm.resetPasswordExpiresAt = domain.resetPasswordExpiresAt;
    return orm;
  }
}
