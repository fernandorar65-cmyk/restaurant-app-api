export const DINING_TABLE_LOOKUP = Symbol('DINING_TABLE_LOOKUP');

export interface DiningTableSnapshot {
  id: string;
  restaurantId: string;
  isOperational: boolean;
}

export interface FloorSnapshot {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

/** A table as the floor plan draws it. */
export interface TableLayoutSnapshot {
  id: string;
  floorId: string;
  code: string;
  name: string;
  capacity: number | null;
  operationalStatus: string;
  serviceStatus: string;
  isOperational: boolean;
  hasActiveQr: boolean;
  positionX: number | null;
  positionY: number | null;
}

/**
 * Attention's own view of a dining table (organizations context). If
 * attention is ever split into its own service only the adapter changes.
 */
export interface DiningTableLookupPort {
  findById(diningTableId: string): Promise<DiningTableSnapshot | null>;
  /** Every floor and table of the restaurant; null if it doesn't exist. */
  findLayout(
    restaurantId: string,
  ): Promise<{ floors: FloorSnapshot[]; tables: TableLayoutSnapshot[] } | null>;
}
