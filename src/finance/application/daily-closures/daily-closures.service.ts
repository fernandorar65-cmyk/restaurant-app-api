import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { BusinessDate } from '../../../common/domain/value-objects/business-date.js';
import { roundMoney } from '../../../common/domain/value-objects/money.js';
import { DailyClosure } from '../../domain/entities/daily-closure.entity.js';
import type { DailyFigures } from '../../domain/entities/daily-closure.entity.js';
import {
  DailyClosureAlreadyExistsError,
  DailyClosureNotFoundError,
  FutureBusinessDateError,
  RestaurantReferenceNotFoundError,
} from '../../domain/exceptions/finance.errors.js';
import { DAILY_CLOSURE_REPOSITORY } from '../../domain/repositories/daily-closure.repository.js';
import type { DailyClosureRepository } from '../../domain/repositories/daily-closure.repository.js';
import { EXPENSE_REPOSITORY } from '../../domain/repositories/expense.repository.js';
import type { ExpenseRepository } from '../../domain/repositories/expense.repository.js';
import {
  ATTENTION_STATS,
  ORGANIZATION_LOOKUP,
  SALES_REPORT,
} from '../ports/finance-lookups.port.js';
import type {
  AttentionStatsPort,
  OrganizationLookupPort,
  SalesReportPort,
} from '../ports/finance-lookups.port.js';

export interface ClosurePreview extends DailyFigures {
  restaurantId: string;
  businessDate: string;
  netSales: number;
  expectedCash: number;
  alreadyClosed: boolean;
}

/**
 * Daily closure of a restaurant. Figures are computed for the business date
 * in the restaurant's time zone, gathered from the contexts that own them
 * (attention, payments) plus finance's own expenses.
 */
@Injectable()
export class DailyClosuresService {
  constructor(
    @Inject(DAILY_CLOSURE_REPOSITORY)
    private readonly closureRepository: DailyClosureRepository,
    @Inject(EXPENSE_REPOSITORY) private readonly expenseRepository: ExpenseRepository,
    @Inject(ORGANIZATION_LOOKUP)
    private readonly organizationLookup: OrganizationLookupPort,
    @Inject(SALES_REPORT) private readonly salesReport: SalesReportPort,
    @Inject(ATTENTION_STATS) private readonly attentionStats: AttentionStatsPort,
  ) {}

  /** What a closure would contain right now, without saving it. */
  async preview(restaurantId: string, businessDate: string): Promise<ClosurePreview> {
    const { date, timeZone } = await this.resolveDate(restaurantId, businessDate);
    const figures = await this.gatherFigures(restaurantId, date, timeZone);
    const existing = await this.closureRepository.findByDate(restaurantId, date.value);
    return {
      restaurantId,
      businessDate: date.value,
      ...figures,
      ...DailyClosure.compute(figures),
      alreadyClosed: existing !== null,
    };
  }

  async close(
    input: {
      restaurantId: string;
      businessDate: string;
      actualCash?: number | null;
      notes?: string | null;
    },
    closedByUserId: string,
  ): Promise<DailyClosure> {
    const { date, timeZone } = await this.resolveDate(
      input.restaurantId,
      input.businessDate,
    );
    if (await this.closureRepository.findByDate(input.restaurantId, date.value)) {
      throw new DailyClosureAlreadyExistsError(date.value);
    }
    const figures = await this.gatherFigures(input.restaurantId, date, timeZone);
    return this.closureRepository.insert(
      DailyClosure.close({
        id: randomUUID(),
        restaurantId: input.restaurantId,
        businessDate: date.value,
        figures,
        actualCash: input.actualCash,
        notes: input.notes,
        closedByUserId,
      }),
    );
  }

  findPage(
    filter: { restaurantId?: string; from?: string; to?: string },
    page: PageRequest,
  ): Promise<Page<DailyClosure>> {
    return this.closureRepository.findPage(filter, page);
  }

  async findOne(id: string): Promise<DailyClosure> {
    const closure = await this.closureRepository.findById(id);
    if (!closure) {
      throw new DailyClosureNotFoundError(id);
    }
    return closure;
  }

  private async resolveDate(restaurantId: string, businessDate: string) {
    const restaurant = await this.organizationLookup.findRestaurant(restaurantId);
    if (!restaurant) {
      throw new RestaurantReferenceNotFoundError(restaurantId);
    }
    const date = BusinessDate.create(businessDate);
    if (date.isAfter(BusinessDate.today(restaurant.timeZone))) {
      throw new FutureBusinessDateError(date.value);
    }
    return { date, timeZone: restaurant.timeZone };
  }

  private async gatherFigures(
    restaurantId: string,
    date: BusinessDate,
    timeZone: string,
  ): Promise<DailyFigures> {
    const [counts, sales, expenses] = await Promise.all([
      this.attentionStats.dailyCounts(restaurantId, date.value, timeZone),
      this.salesReport.dailyByMethod(restaurantId, date.value, timeZone),
      this.expenseRepository.dailyTotals(restaurantId, date.value),
    ]);
    const grossSales = roundMoney(sales.reduce((sum, row) => sum + row.gross, 0));
    const refundedAmount = roundMoney(sales.reduce((sum, row) => sum + row.refunded, 0));
    return {
      openedAttentions: counts.opened,
      closedAttentions: counts.closed,
      cancelledAttentions: counts.cancelled,
      grossSales,
      refundedAmount,
      expenseAmount: expenses.total,
      cashExpenseAmount: expenses.cash,
      // A refund of a previous day's payment can exceed today's collection.
      paymentTotals: sales.map((row) => ({
        method: row.method,
        amount: Math.max(0, roundMoney(row.gross - row.refunded)),
      })),
    };
  }
}
