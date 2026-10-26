export const PAYMENT_LEDGER = Symbol('PAYMENT_LEDGER');

/**
 * What attention needs to know about payments: the amount effectively paid
 * for an attention (confirmed payments minus confirmed refunds) and which
 * products are already covered by a payment.
 */
export interface PaymentLedgerPort {
  paidAmount(attentionId: string): Promise<number>;
  /** Items covered by confirmed or in-flight payments. */
  itemsWithPayments(orderItemIds: string[]): Promise<string[]>;
}
