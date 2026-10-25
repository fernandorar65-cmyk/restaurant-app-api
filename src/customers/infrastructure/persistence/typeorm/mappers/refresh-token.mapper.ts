import { RefreshToken } from '../../../../domain/entities/refresh-token.entity.js';
import { RefreshTokenOrmEntity } from '../entities/refresh-token.orm-entity.js';

export class RefreshTokenMapper {
  static toDomain(orm: RefreshTokenOrmEntity): RefreshToken {
    return RefreshToken.fromPersistence({
      id: orm.id,
      customerId: orm.customerId,
      tokenHash: orm.tokenHash,
      expiresAt: orm.expiresAt,
      revokedAt: orm.revokedAt ?? null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: RefreshToken,
    existing?: RefreshTokenOrmEntity,
  ): RefreshTokenOrmEntity {
    const orm = existing ?? new RefreshTokenOrmEntity();
    orm.id = domain.id;
    orm.customerId = domain.customerId;
    orm.tokenHash = domain.tokenHash;
    orm.expiresAt = domain.expiresAt;
    orm.revokedAt = domain.revokedAt ?? undefined;
    return orm;
  }
}
