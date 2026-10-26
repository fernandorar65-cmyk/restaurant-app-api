/**
 * Stable codes of the internal payment statuses (payment_statuses catalog).
 * The domain only reasons with these codes, never with a gateway's own
 * statuses, which are translated through payment_provider_status_mappings.
 */
export enum PaymentStatusCode {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
}
