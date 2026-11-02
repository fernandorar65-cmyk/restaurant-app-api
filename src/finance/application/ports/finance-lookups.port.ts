import type { PaymentMethod } from '../../../common/domain/payment-method.enum.js';

export const SALES_REPORT = Symbol('FINANCE_SALES_REPORT');
export const ATTENTION_STATS = Symbol('FINANCE_ATTENTION_STATS');

export interface MethodSales {
  method: PaymentMethod;
  gross: number;
  refunded: number;
}

export interface DatedMethodSales extends MethodSales {
  businessDate: string;
}

/** Collected money per payment method for a business date (payments context). */
export interface SalesReportPort {
  dailyByMethod(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<MethodSales[]>;
  /** The same per business date of an inclusive range (only dates with money). */
  byMethodAndDate(
    restaurantId: string,
    from: string,
    to: string,
    timeZone: string,
  ): Promise<DatedMethodSales[]>;
}

export interface AttentionCounts {
  opened: number;
  closed: number;
  cancelled: number;
}

export interface DatedAttentionCounts extends AttentionCounts {
  businessDate: string;
}

export interface ReportPeriod {
  restaurantId: string;
  from: string;
  to: string;
  timeZone: string;
}

export interface ProductSalesRow {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

/** Average minutes items spent between two canonical kitchen states. */
export interface StageTime {
  from: string;
  to: string;
  averageMinutes: number;
  items: number;
}

/** Attention activity of a business date (attention context). */
export interface AttentionStatsPort {
  dailyCounts(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<AttentionCounts>;
  /** Per business date of an inclusive range (only dates with activity). */
  countsByDate(period: ReportPeriod): Promise<DatedAttentionCounts[]>;
  topProducts(period: ReportPeriod, limit: number): Promise<ProductSalesRow[]>;
  stageTimes(period: ReportPeriod): Promise<StageTime[]>;
}
