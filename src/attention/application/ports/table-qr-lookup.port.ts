export const TABLE_QR_LOOKUP = Symbol('TABLE_QR_LOOKUP');

export interface TableQrResolution {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  tableId: string;
  tableNumber: string;
  tableStatus: string;
}

/**
 * Attention's own view of a QR code → table → restaurant chain, limited to
 * what it needs to resolve the "scan a QR" entry point. Backed today by an
 * in-process adapter that calls organizations' services directly.
 */
export interface TableQrLookupPort {
  resolveByToken(token: string): Promise<TableQrResolution | null>;
}
