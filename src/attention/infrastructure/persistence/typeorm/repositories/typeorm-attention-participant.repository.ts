import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { transactionalRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { AttentionParticipant } from '../../../../domain/entities/attention-participant.entity.js';
import { AttentionParticipantRepository } from '../../../../domain/repositories/attention-participant.repository.js';
import { AttentionParticipantOrmEntity } from '../entities/attention-participant.orm-entity.js';
import { AttentionParticipantMapper } from '../mappers/attention.mappers.js';

@Injectable()
export class TypeOrmAttentionParticipantRepository
  implements AttentionParticipantRepository
{
  constructor(
    @InjectRepository(AttentionParticipantOrmEntity)
    private readonly repository: Repository<AttentionParticipantOrmEntity>,
  ) {}

  async findByAttention(attentionId: string): Promise<AttentionParticipant[]> {
    const rows = await this.repository.find({
      where: { attentionId },
      order: { joinedAt: 'ASC' },
    });
    return rows.map((row) => AttentionParticipantMapper.toDomain(row));
  }

  async findByIdentity(
    attentionId: string,
    identity: { userId?: string | null; guestToken?: string | null },
    tx?: TransactionContext,
  ): Promise<AttentionParticipant | null> {
    const repository = transactionalRepository(this.repository, tx);
    if (identity.userId) {
      const byUser = await repository.findOne({
        where: { attentionId, userId: identity.userId },
      });
      if (byUser) {
        return AttentionParticipantMapper.toDomain(byUser);
      }
    }
    if (identity.guestToken) {
      const byGuest = await repository.findOne({
        where: { attentionId, guestToken: identity.guestToken },
      });
      if (byGuest) {
        return AttentionParticipantMapper.toDomain(byGuest);
      }
    }
    return null;
  }

  async save(
    participant: AttentionParticipant,
    tx?: TransactionContext,
  ): Promise<AttentionParticipant> {
    const saved = await transactionalRepository(this.repository, tx).save(
      AttentionParticipantMapper.toPersistence(participant),
    );
    return AttentionParticipantMapper.toDomain(saved);
  }
}
