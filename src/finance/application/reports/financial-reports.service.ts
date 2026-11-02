import { Inject, Injectable } from '@nestjs/common';
import { TENANT_LOOKUP } from '../../../common/application/ports/tenant-lookup.port.js';
import type { TenantLookup } from '../../../common/application/ports/tenant-lookup.port.js';
import { BusinessDateRange } from '../../../common/domain/value-objects/business-date-range.js';
import { RestaurantReferenceNotFoundError } from '../../domain/exceptions/finance.errors.js';
import { EXPENSE_REPOSITORY } from '../../domain/repositories/expense.repository.js';
import type { ExpenseRepository } from '../../domain/repositories/expense.repository.js';
import {
  buildDailySeries,
  summarizePeriod,
} from '../../domain/services/financial-reports.js';
import type {
  DailyFinancials,
  PeriodTotals,
} from '../../domain/services/financial-reports.js';
import {
  ATTENTION_STATS,
  SALES_REPORT,
} from '../ports/finance-lookups.port.js';
import type {
  AttentionStatsPort,
  ProductSalesRow,
  ReportPeriod,
  SalesReportPort,
  StageTime,
} from '../ports/finance-lookups.port.js';

/** Longest period a report covers. */
export const MAX_REPORT_DAYS = 366;

export interface DailyFinancialsReport {
  restaurantId: string;
  from: string;
  to: string;
  days: DailyFinancials[];
  totals: PeriodTotals;
}

export interface RestaurantMetrics {
  restaurantId: string;
  from: string;
  to: string;
  totals: PeriodTotals;
  topProducts: ProductSalesRow[];
  stageTimes: StageTime[];
}

/**
 * Reports over a period of a restaurant, in its time zone. Each figure means
 * the same as in the daily closure, so a day of the series matches the
 * preview of that day.
 */
@Injectable()
export class FinancialReportsService {
  constructor(
    @Inject(TENANT_LOOKUP) private readonly restaurants: TenantLookup,
    @Inject(SALES_REPORT) private readonly salesReport: SalesReportPort,
    @Inject(ATTENTION_STATS)
    private readonly attentionStats: AttentionStatsPort,
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: ExpenseRepository,
  ) {}

  async dailyFinancials(
    restaurantId: string,
    from: string,
    to: string,
  ): Promise<DailyFinancialsReport> {
    const { period, range } = await this.resolve(restaurantId, from, to);
    const days = await this.series(period, range);
    return { restaurantId, from, to, days, totals: summarizePeriod(days) };
  }

  async metrics(
    restaurantId: string,
    from: string,
    to: string,
    topLimit: number,
  ): Promise<RestaurantMetrics> {
    const { period, range } = await this.resolve(restaurantId, from, to);
    const [days, topProducts, stageTimes] = await Promise.all([
      this.series(period, range),
      this.attentionStats.topProducts(period, topLimit),
      this.attentionStats.stageTimes(period),
    ]);
    return {
      restaurantId,
      from,
      to,
      totals: summarizePeriod(days),
      topProducts,
      stageTimes,
    };
  }

  private async series(
    period: ReportPeriod,
    range: BusinessDateRange,
  ): Promise<DailyFinancials[]> {
    const [activity, sales, expenses] = await Promise.all([
      this.attentionStats.countsByDate(period),
      this.salesReport.byMethodAndDate(
        period.restaurantId,
        period.from,
        period.to,
        period.timeZone,
      ),
      this.expenseRepository.totalsByDate(
        period.restaurantId,
        period.from,
        period.to,
      ),
    ]);
    return buildDailySeries(range.days(), { activity, sales, expenses });
  }

  private async resolve(restaurantId: string, from: string, to: string) {
    const range = BusinessDateRange.create(from, to, MAX_REPORT_DAYS);
    const restaurant = await this.restaurants.findRestaurant(restaurantId);
    if (!restaurant) {
      throw new RestaurantReferenceNotFoundError(restaurantId);
    }
    const period: ReportPeriod = {
      restaurantId,
      from: range.from.value,
      to: range.to.value,
      timeZone: restaurant.timeZone,
    };
    return { period, range };
  }
}
