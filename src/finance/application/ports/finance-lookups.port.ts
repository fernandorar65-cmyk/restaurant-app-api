import type { PaymentMethod } from '../../../common/domain/payment-method.enum.js';

export const ORGANIZATION_LOOKUP = Symbol('FINANCE_ORGANIZATION_LOOKUP');
export const SALES_REPORT = Symbol('FINANCE_SALES_REPORT');
export const ATTENTION_STATS = Symbol('FINANCE_ATTENTION_STATS');

export interface RestaurantSnapshot {
  id: string;
  organizationId: string;
  timeZone: string;
}

/** Finance's view of organizations: existence and restaurant settings. */
export interface OrganizationLookupPort {
  organizationExists(organizationId: string): Promise<boolean>;
  findRestaurant(restaurantId: string): Promise<RestaurantSnapshot | null>;
}

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
