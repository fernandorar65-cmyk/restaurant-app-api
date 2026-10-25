export const TABLE_QR_LOOKUP = Symbol('TABLE_QR_LOOKUP');

export interface TableQrResolution {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  tableId: string;
  tableCode: string;
  tableName: string;
}

/**
 * Attention's own view of the "scan a QR" chain (token -> table ->
 * restaurant). Returns null for unknown or revoked tokens.
 */
export interface TableQrLookupPort {
  resolveByToken(token: string): Promise<TableQrResolution | null>;
}
