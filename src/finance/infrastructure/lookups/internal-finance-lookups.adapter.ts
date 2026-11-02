import { Injectable } from '@nestjs/common';
import { AttentionReportsService } from '../../../attention/public-api.js';
import { PaymentLedgerService } from '../../../payments/public-api.js';
import {
  AttentionCounts,
  AttentionStatsPort,
  DatedAttentionCounts,
  DatedMethodSales,
  MethodSales,
  ProductSalesRow,
  ReportPeriod,
  SalesReportPort,
  StageTime,
} from '../../application/ports/finance-lookups.port.js';

/** In-process adapter over the payments context's public ledger. */
@Injectable()
export class InternalSalesReportAdapter implements SalesReportPort {
  constructor(private readonly ledger: PaymentLedgerService) {}

  dailyByMethod(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<MethodSales[]> {
    return this.ledger.dailyTotals(restaurantId, businessDate, timeZone);
  }

  byMethodAndDate(
    restaurantId: string,
    from: string,
    to: string,
    timeZone: string,
  ): Promise<DatedMethodSales[]> {
    return this.ledger.totalsByDate(restaurantId, from, to, timeZone);
  }
}

/** In-process adapter over attention's public reports. */
@Injectable()
export class InternalAttentionStatsAdapter implements AttentionStatsPort {
  constructor(private readonly reports: AttentionReportsService) {}

  dailyCounts(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<AttentionCounts> {
    return this.reports.dailyCounts(restaurantId, businessDate, timeZone);
  }

  countsByDate(period: ReportPeriod): Promise<DatedAttentionCounts[]> {
    return this.reports.countsByDate(
      period.restaurantId,
      period.from,
      period.to,
      period.timeZone,
    );
  }

  topProducts(period: ReportPeriod, limit: number): Promise<ProductSalesRow[]> {
    return this.reports.productSales(period, limit);
  }

  stageTimes(period: ReportPeriod): Promise<StageTime[]> {
    return this.reports.stageDurations(period);
  }
}
