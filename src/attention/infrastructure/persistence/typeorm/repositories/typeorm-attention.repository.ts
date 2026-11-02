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
  DatedAttentionCounts,
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

  async findPageByUser(
    userId: string,
    page: PageRequest,
  ): Promise<Page<Attention>> {
    const [rows, total] = await this.repository
      .createQueryBuilder('attention')
      .leftJoinAndSelect('attention.status', 'status')
      .leftJoinAndSelect('attention.serviceType', 'serviceType')
      .where('attention.customer_user_id = :userId', { userId })
      .orWhere(
        `EXISTS (SELECT 1 FROM attention_participants participant
          WHERE participant.attention_id = attention.id AND participant.user_id = :userId)`,
      )
      .orderBy('attention.openedAt', 'DESC')
      .skip((page.page - 1) * page.limit)
      .take(page.limit)
      .getManyAndCount();
    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
      page: page.page,
      limit: page.limit,
    };
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

  async countByDate(
    restaurantId: string,
    from: string,
    to: string,
    timeZone: string,
  ): Promise<DatedAttentionCounts[]> {
    // One row per (attention, event): opened, closed and cancelled can fall on different days.
    const rows = await this.repository.query<
      {
        business_date: string;
        opened: string;
        closed: string;
        cancelled: string;
      }[]
    >(
      `SELECT to_char(event.day, 'YYYY-MM-DD') AS business_date,
              COUNT(*) FILTER (WHERE event.kind = 'opened') AS opened,
              COUNT(*) FILTER (WHERE event.kind = 'closed') AS closed,
              COUNT(*) FILTER (WHERE event.kind = 'cancelled') AS cancelled
         FROM attentions a
         CROSS JOIN LATERAL (VALUES
           ('opened', (a.opened_at AT TIME ZONE $2)::date),
           ('closed', (a.closed_at AT TIME ZONE $2)::date),
           ('cancelled', (a.cancelled_at AT TIME ZONE $2)::date)
         ) AS event(kind, day)
        WHERE a.restaurant_id = $1 AND event.day BETWEEN $3 AND $4
        GROUP BY event.day
        ORDER BY event.day`,
      [restaurantId, timeZone, from, to],
    );
    return rows.map((row) => ({
      businessDate: row.business_date,
      opened: Number(row.opened),
      closed: Number(row.closed),
      cancelled: Number(row.cancelled),
    }));
  }

  async findActiveByRestaurant(restaurantId: string): Promise<Attention[]> {
    const rows = await this.repository.find({
      where: { restaurantId, closedAt: IsNull(), cancelledAt: IsNull() },
      relations: this.relations,
      order: { openedAt: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
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
