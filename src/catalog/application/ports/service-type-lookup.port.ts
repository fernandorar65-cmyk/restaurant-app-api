import type { ServiceMode } from '../../domain/service-mode.js';

export const SERVICE_TYPE_LOOKUP = Symbol('CATALOG_SERVICE_TYPE_LOOKUP');

export interface ServiceTypeSnapshot {
  minimumOrderAmount: number;
  deliveryFee: number;
}

/** Catalog's view of the restaurant's service types (attention context). */
export interface ServiceTypeLookupPort {
  /** The restaurant's first active service type of the mode; null when it offers none. */
  findActive(
    restaurantId: string,
    mode: ServiceMode,
  ): Promise<ServiceTypeSnapshot | null>;
}
