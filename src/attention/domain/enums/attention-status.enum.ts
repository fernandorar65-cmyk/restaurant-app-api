/**
 * Canonical commercial cycle of an attention (attention_statuses.canonical_state).
 * Restaurants rename, recolor and reorder their statuses; the backend only
 * reasons with these values.
 */
export enum AttentionStatus {
  OPEN = 'OPEN',
  BILL_REQUESTED = 'BILL_REQUESTED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}
