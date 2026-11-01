/**
 * Canonical operational cycle shared by orders and their items
 * (order_statuses.canonical_state). It never holds commercial states such as
 * "bill requested" or "paid": those belong to the attention. There is no
 * DRAFT: the cart lives in the client until the order is sent. CONFIRMED is
 * only used by orders and REJECTED only by items.
 */
export enum OrderStatus {
  SUBMITTED = 'SUBMITTED',
  CONFIRMED = 'CONFIRMED',
  IN_PREPARATION = 'IN_PREPARATION',
  READY = 'READY',
  SERVED = 'SERVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}
