import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { RefreshToken } from '../../../../domain/entities/refresh-token.entity.js';
import { RefreshTokenRepository } from '../../../../domain/repositories/refresh-token.repository.js';
import { RefreshTokenOrmEntity } from '../entities/refresh-token.orm-entity.js';
import { RefreshTokenMapper } from '../mappers/refresh-token.mapper.js';

@Injectable()
export class TypeOrmRefreshTokenRepository
  extends TypeOrmBaseRepository<RefreshToken, RefreshTokenOrmEntity>
  implements RefreshTokenRepository
{
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    repository: Repository<RefreshTokenOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: RefreshTokenOrmEntity): RefreshToken {
    return RefreshTokenMapper.toDomain(orm);
  }

  async revokeIfActive(id: string, tokenHash: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .update(RefreshTokenOrmEntity)
      .set({ revokedAt: () => 'CURRENT_TIMESTAMP' })
      .where('id = :id', { id })
      .andWhere('token_hash = :tokenHash', { tokenHash })
      .andWhere('revoked_at IS NULL')
      .andWhere('expires_at > CURRENT_TIMESTAMP')
      .execute();
    return result.affected === 1;
  }

  protected toPersistence(
    domain: RefreshToken,
    existing?: RefreshTokenOrmEntity,
  ): RefreshTokenOrmEntity {
    return RefreshTokenMapper.toPersistence(domain, existing);
  }
}
