import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import { withoutUndefined } from '../../../../../common/persistence/typeorm-base.repository.js';
import { DailyClosure } from '../../../../domain/entities/daily-closure.entity.js';
import { DailyClosureRepository } from '../../../../domain/repositories/daily-closure.repository.js';
import { DailyClosurePaymentTotalOrmEntity } from '../entities/daily-closure-payment-total.orm-entity.js';
import { DailyClosureOrmEntity } from '../entities/daily-closure.orm-entity.js';
import { DailyClosureMapper } from '../mappers/finance.mappers.js';
import { dateRange } from './typeorm-expense.repository.js';

/** The closure and its per-method totals are one aggregate. */
@Injectable()
export class TypeOrmDailyClosureRepository implements DailyClosureRepository {
  constructor(
    @InjectRepository(DailyClosureOrmEntity)
    private readonly repository: Repository<DailyClosureOrmEntity>,
    @InjectRepository(DailyClosurePaymentTotalOrmEntity)
    private readonly totalsRepository: Repository<DailyClosurePaymentTotalOrmEntity>,
  ) {}

  async findById(id: string): Promise<DailyClosure | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? (await this.withTotals([found]))[0] : null;
  }

  async findByDate(
    restaurantId: string,
    businessDate: string,
  ): Promise<DailyClosure | null> {
    const found = await this.repository.findOne({ where: { restaurantId, businessDate } });
    return found ? (await this.withTotals([found]))[0] : null;
  }

  async findPage(
    filter: { restaurantId?: string; from?: string; to?: string },
    page: PageRequest,
  ): Promise<Page<DailyClosure>> {
    const [rows, total] = await this.repository.findAndCount({
      where: withoutUndefined({
        restaurantId: filter.restaurantId,
        businessDate: dateRange(filter.from, filter.to),
      }),
      order: { businessDate: 'DESC' },
      skip: (page.page - 1) * page.limit,
      take: page.limit,
    });
    return {
      items: await this.withTotals(rows),
      total,
      page: page.page,
      limit: page.limit,
    };
  }

  async insert(closure: DailyClosure): Promise<DailyClosure> {
    await this.repository.manager.transaction(async (manager) => {
      await manager.getRepository(DailyClosureOrmEntity).insert(
        DailyClosureMapper.toPersistence(closure),
      );
      if (closure.paymentTotals.length > 0) {
        await manager.getRepository(DailyClosurePaymentTotalOrmEntity).insert(
          closure.paymentTotals.map((total) => ({
            dailyClosureId: closure.id,
            paymentMethod: total.method,
            amount: total.amount,
          })),
        );
      }
    });
    return (await this.findById(closure.id)) as DailyClosure;
  }

  private async withTotals(rows: DailyClosureOrmEntity[]): Promise<DailyClosure[]> {
    if (rows.length === 0) {
      return [];
    }
    const totals = await this.totalsRepository.find({
      where: { dailyClosureId: In(rows.map((row) => row.id)) },
    });
    return rows.map((row) =>
      DailyClosureMapper.toDomain(
        row,
        totals.filter((total) => total.dailyClosureId === row.id),
      ),
    );
  }
}
