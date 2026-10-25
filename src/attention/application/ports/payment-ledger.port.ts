export const PAYMENT_LEDGER = Symbol('PAYMENT_LEDGER');

/**
 * What attention needs to know about payments: the amount effectively paid
 * for an attention (confirmed payments minus confirmed refunds).
 */
export interface PaymentLedgerPort {
  paidAmount(attentionId: string): Promise<number>;
}
