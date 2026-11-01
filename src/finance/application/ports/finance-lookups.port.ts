import type { PaymentMethod } from '../../../common/domain/payment-method.enum.js';

export const SALES_REPORT = Symbol('FINANCE_SALES_REPORT');
export const ATTENTION_STATS = Symbol('FINANCE_ATTENTION_STATS');

export interface MethodSales {
  method: PaymentMethod;
  gross: number;
  refunded: number;
}

/** Collected money per payment method for a business date (payments context). */
export interface SalesReportPort {
  dailyByMethod(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<MethodSales[]>;
}

/** Attention activity of a business date (attention context). */
export interface AttentionStatsPort {
  dailyCounts(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<{ opened: number; closed: number; cancelled: number }>;
}
