import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Attention } from '../../../../domain/entities/attention.entity.js';
import { AttentionStatus } from '../../../../domain/enums/attention-status.enum.js';
import { ActiveAttentionAlreadyExistsError } from '../../../../domain/exceptions/attention.errors.js';
import { AttentionRepository } from '../../../../domain/repositories/attention.repository.js';
import { AttentionOrmEntity } from '../entities/attention.orm-entity.js';
import { AttentionMapper } from '../mappers/attention.mappers.js';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';

const ACTIVE_STATUSES = [AttentionStatus.OPEN, AttentionStatus.BILL_REQUESTED];

@Injectable()
export class TypeOrmAttentionRepository
  extends TypeOrmBaseRepository<Attention, AttentionOrmEntity>
  implements AttentionRepository
{
  constructor(
    @InjectRepository(AttentionOrmEntity)
    repository: Repository<AttentionOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: AttentionOrmEntity): Attention {
    return AttentionMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: Attention,
    existing?: AttentionOrmEntity,
  ): AttentionOrmEntity {
    return AttentionMapper.toPersistence(domain, existing);
  }

  async findPage(
    filter: { restaurantId?: string; status?: AttentionStatus },
    page: PageRequest,
  ): Promise<Page<Attention>> {
    return this.findPageBy({
      where: { restaurantId: filter.restaurantId, status: filter.status },
      order: { openedAt: 'DESC' },
    }, page);
  }

  async findActiveByDiningTable(
    diningTableId: string,
    tx?: TransactionContext,
  ): Promise<Attention | null> {
    const found = await this.getRepository(tx).findOne({
      where: { diningTableId, status: In(ACTIVE_STATUSES) },
    });
    return found ? this.toDomain(found) : null;
  }

  override async save(
    attention: Attention,
    tx?: TransactionContext,
  ): Promise<Attention> {
    try {
      return await super.save(attention, tx);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { constraint?: string }).constraint ===
          'uq_attentions_active_table' &&
        attention.diningTableId
      ) {
        throw new ActiveAttentionAlreadyExistsError(attention.diningTableId);
      }
      throw error;
    }
  }
}
