export enum ProviderEventResult {
  /** Applied (or already reflected) on the payment. */
  PROCESSED = 'PROCESSED',
  /** Valid but nothing to apply: unknown payment or out-of-order status. */
  IGNORED = 'IGNORED',
  /** Could not be applied, e.g. the external status has no active mapping. */
  FAILED = 'FAILED',
}
