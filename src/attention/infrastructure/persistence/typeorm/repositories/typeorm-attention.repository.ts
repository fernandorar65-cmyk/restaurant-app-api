import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import type { FindOptionsRelations } from 'typeorm';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { TypeOrmBaseRepository } from '../../../../../common/infrastructure/persistence/typeorm-base.repository.js';
import { Attention } from '../../../../domain/entities/attention.entity.js';
import { AttentionStatus } from '../../../../domain/enums/attention-status.enum.js';
import { ActiveAttentionAlreadyExistsError } from '../../../../domain/exceptions/attention.errors.js';
import {
  AttentionRepository,
  DailyAttentionCounts,
} from '../../../../domain/repositories/attention.repository.js';
import { AttentionOrmEntity } from '../entities/attention.orm-entity.js';
import { AttentionMapper } from '../mappers/attention.mappers.js';
import type {
  Page,
  PageRequest,
} from '../../../../../common/domain/pagination.js';

@Injectable()
export class TypeOrmAttentionRepository
  extends TypeOrmBaseRepository<Attention, AttentionOrmEntity>
  implements AttentionRepository
{
  protected override readonly relations: FindOptionsRelations<AttentionOrmEntity> =
    {
      status: true,
      serviceType: true,
    };

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

  async findByIdForUpdate(
    id: string,
    tx: TransactionContext,
  ): Promise<Attention | null> {
    return this.findByIdLocked(id, tx);
  }

  async findPage(
    filter: { restaurantId?: string; status?: AttentionStatus },
    page: PageRequest,
  ): Promise<Page<Attention>> {
    return this.findPageBy(
      {
        where: {
          restaurantId: filter.restaurantId,
          status: filter.status && { canonicalState: filter.status },
        },
        order: { openedAt: 'DESC' },
      },
      page,
    );
  }

  async countDaily(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<DailyAttentionCounts> {
    const onDate = (column: string) =>
      `COUNT(*) FILTER (WHERE (attention.${column} AT TIME ZONE :timeZone)::date = :businessDate)`;
    const row = await this.repository
      .createQueryBuilder('attention')
      .select(onDate('opened_at'), 'opened')
      .addSelect(onDate('closed_at'), 'closed')
      .addSelect(onDate('cancelled_at'), 'cancelled')
      .where('attention.restaurant_id = :restaurantId', { restaurantId })
      .setParameters({ timeZone, businessDate })
      .getRawOne<{ opened: string; closed: string; cancelled: string }>();
    return {
      opened: Number(row?.opened ?? 0),
      closed: Number(row?.closed ?? 0),
      cancelled: Number(row?.cancelled ?? 0),
    };
  }

  async findActiveByDiningTable(
    diningTableId: string,
    tx?: TransactionContext,
  ): Promise<Attention | null> {
    // Active = neither closed nor cancelled (same predicate as uq_attentions_active_table).
    const found = await this.getRepository(tx).findOne({
      where: { diningTableId, closedAt: IsNull(), cancelledAt: IsNull() },
      relations: this.relations,
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
