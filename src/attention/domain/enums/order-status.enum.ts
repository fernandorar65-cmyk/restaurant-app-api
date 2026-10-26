/**
 * Operational cycle of one order (kitchen / floor). It never holds commercial
 * states such as "bill requested" or "paid": those belong to the attention.
 * There is no DRAFT: the cart lives in the client until the order is sent.
 */
export enum OrderStatus {
  SUBMITTED = 'SUBMITTED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}
