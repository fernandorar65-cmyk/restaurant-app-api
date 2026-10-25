/**
 * Opaque handle to an open transaction. Application services pass it through
 * to repositories without knowing which persistence technology backs it.
 */
export interface TransactionContext {
  readonly kind: 'transaction-context';
}
