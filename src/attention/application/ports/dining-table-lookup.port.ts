export const DINING_TABLE_LOOKUP = Symbol('DINING_TABLE_LOOKUP');

export interface DiningTableSnapshot {
  id: string;
  restaurantId: string;
  isOperational: boolean;
}

/**
 * Attention's own view of a dining table (organizations context). If
 * attention is ever split into its own service only the adapter changes.
 */
export interface DiningTableLookupPort {
  findById(diningTableId: string): Promise<DiningTableSnapshot | null>;
}
