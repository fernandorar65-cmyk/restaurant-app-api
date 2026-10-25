import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { PasswordResetToken } from '../../../../domain/entities/password-reset-token.entity.js';
import { PasswordResetTokenRepository } from '../../../../domain/repositories/password-reset-token.repository.js';
import { PasswordResetTokenOrmEntity } from '../entities/password-reset-token.orm-entity.js';
import { PasswordResetTokenMapper } from '../mappers/password-reset-token.mapper.js';

@Injectable()
export class TypeOrmPasswordResetTokenRepository
  extends TypeOrmBaseRepository<PasswordResetToken, PasswordResetTokenOrmEntity>
  implements PasswordResetTokenRepository
{
  constructor(
    @InjectRepository(PasswordResetTokenOrmEntity)
    repository: Repository<PasswordResetTokenOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: PasswordResetTokenOrmEntity): PasswordResetToken {
    return PasswordResetTokenMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: PasswordResetToken,
    existing?: PasswordResetTokenOrmEntity,
  ): PasswordResetTokenOrmEntity {
    return PasswordResetTokenMapper.toPersistence(domain, existing);
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const found = await this.repository.findOne({ where: { tokenHash } });
    return found ? this.toDomain(found) : null;
  }
}
