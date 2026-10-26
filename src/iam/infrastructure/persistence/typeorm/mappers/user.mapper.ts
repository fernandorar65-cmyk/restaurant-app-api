import { User } from '../../../../domain/entities/user.entity.js';
import { UserOrmEntity } from '../entities/user.orm-entity.js';

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return User.fromPersistence({
      id: orm.id,
      email: orm.email,
      passwordHash: orm.passwordHash,
      firstName: orm.firstName,
      lastName: orm.lastName,
      phone: orm.phone,
      status: orm.status,
      mustChangePassword: orm.mustChangePassword,
      isPlatformAdmin: orm.isPlatformAdmin,
      lastLoginAt: orm.lastLoginAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: User, existing?: UserOrmEntity): UserOrmEntity {
    const orm = existing ?? new UserOrmEntity();
    orm.id = domain.id;
    orm.email = domain.email;
    orm.passwordHash = domain.passwordHash;
    orm.firstName = domain.firstName;
    orm.lastName = domain.lastName;
    orm.phone = domain.phone;
    orm.status = domain.status;
    orm.mustChangePassword = domain.mustChangePassword;
    orm.lastLoginAt = domain.lastLoginAt;
    return orm;
  }
}
