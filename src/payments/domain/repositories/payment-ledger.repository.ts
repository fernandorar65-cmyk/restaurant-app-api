import type { PaymentMethod } from '../../../common/domain/payment-method.enum.js';

export const PAYMENT_LEDGER_REPOSITORY = Symbol('PAYMENT_LEDGER_REPOSITORY');

export interface MethodTotals {
  method: PaymentMethod;
  /** Payments whose status counts toward the balance. */
  gross: number;
  /** Refunds whose status counts as refunded. */
  refunded: number;
}

export interface DatedMethodTotals extends MethodTotals {
  /** Business date (YYYY-MM-DD) in the restaurant's time zone. */
  businessDate: string;
}

/** Read model over payments and refunds. */
export interface PaymentLedgerRepository {
  /** Confirmed payments minus confirmed refunds of an attention. */
  paidAmount(attentionId: string): Promise<number>;
  /** Which of these items are covered by confirmed or in-flight payments. */
  itemsWithPayments(orderItemIds: string[]): Promise<string[]>;
  /** Per payment method, for one business date in the restaurant's time zone. */
  dailyTotals(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<MethodTotals[]>;
  /** Per business date and payment method, for an inclusive range of dates. */
  totalsByDate(
    restaurantId: string,
    from: string,
    to: string,
    timeZone: string,
  ): Promise<DatedMethodTotals[]>;
}
