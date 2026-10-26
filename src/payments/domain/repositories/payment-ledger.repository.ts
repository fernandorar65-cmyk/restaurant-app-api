import type { PaymentMethod } from '../../../common/domain/payment-method.enum.js';

export const PAYMENT_LEDGER_REPOSITORY = Symbol('PAYMENT_LEDGER_REPOSITORY');

export interface MethodTotals {
  method: PaymentMethod;
  /** Confirmed payments (PAID, PARTIALLY_REFUNDED, REFUNDED). */
  gross: number;
  /** Confirmed refunds of those payments. */
  refunded: number;
}

/** Read model over payments and refunds. */
export interface PaymentLedgerRepository {
  /** Confirmed payments minus confirmed refunds of an attention. */
  paidAmount(attentionId: string): Promise<number>;
  /** Per payment method, for one business date in the restaurant's time zone. */
  dailyTotals(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<MethodTotals[]>;
}
