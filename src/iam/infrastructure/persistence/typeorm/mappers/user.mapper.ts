import { User } from '../../../../domain/entities/user.entity.js';
import { UserOrmEntity } from '../entities/user.orm-entity.js';

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return User.fromPersistence({
      id: orm.id,
      name: orm.name,
      email: orm.email,
      passwordHash: orm.passwordHash,
      roleId: orm.roleId,
      resetPasswordTokenHash: orm.resetPasswordTokenHash,
      resetPasswordExpiresAt: orm.resetPasswordExpiresAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: User, existing?: UserOrmEntity): UserOrmEntity {
    const orm = existing ?? new UserOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.email = domain.email;
    orm.passwordHash = domain.passwordHash;
    orm.roleId = domain.roleId;
    orm.resetPasswordTokenHash = domain.resetPasswordTokenHash;
    orm.resetPasswordExpiresAt = domain.resetPasswordExpiresAt;
    return orm;
  }
}
