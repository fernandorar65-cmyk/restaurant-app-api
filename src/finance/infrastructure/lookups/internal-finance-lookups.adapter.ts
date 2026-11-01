import { Injectable } from '@nestjs/common';
import { AttentionReportsService } from '../../../attention/public-api.js';
import { PaymentLedgerService } from '../../../payments/public-api.js';
import {
  AttentionStatsPort,
  MethodSales,
  SalesReportPort,
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
}

/** In-process adapter over attention's public reports. */
@Injectable()
export class InternalAttentionStatsAdapter implements AttentionStatsPort {
  constructor(private readonly reports: AttentionReportsService) {}

  dailyCounts(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<{ opened: number; closed: number; cancelled: number }> {
    return this.reports.dailyCounts(restaurantId, businessDate, timeZone);
  }
}
