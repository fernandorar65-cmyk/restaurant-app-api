import { PasswordResetToken } from '../../../../domain/entities/password-reset-token.entity.js';
import { PasswordResetTokenOrmEntity } from '../entities/password-reset-token.orm-entity.js';

export class PasswordResetTokenMapper {
  static toDomain(orm: PasswordResetTokenOrmEntity): PasswordResetToken {
    return PasswordResetToken.fromPersistence({
      id: orm.id,
      userId: orm.userId,
      tokenHash: orm.tokenHash,
      expiresAt: orm.expiresAt,
      usedAt: orm.usedAt,
      createdAt: orm.createdAt,
    });
  }

  static toPersistence(
    domain: PasswordResetToken,
    existing?: PasswordResetTokenOrmEntity,
  ): PasswordResetTokenOrmEntity {
    const orm = existing ?? new PasswordResetTokenOrmEntity();
    orm.id = domain.id;
    orm.userId = domain.userId;
    orm.tokenHash = domain.tokenHash;
    orm.expiresAt = domain.expiresAt;
    orm.usedAt = domain.usedAt;
    return orm;
  }
}
