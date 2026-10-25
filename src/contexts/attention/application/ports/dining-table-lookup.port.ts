export const DINING_TABLE_LOOKUP = Symbol('DINING_TABLE_LOOKUP');

/**
 * Attention's own view of "does this dining table exist". Backed today by
 * an in-process adapter that calls organizations' DiningTablesService
 * directly (see infrastructure/lookups). If attention ever moves to its
 * own service, only that adapter changes (e.g. to an HTTP client) — this
 * port, and everything that depends on it, stays the same.
 */
export interface DiningTableLookupPort {
  exists(diningTableId: string): Promise<boolean>;
}
