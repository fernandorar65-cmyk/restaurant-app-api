import type { ServiceMode } from '../../domain/service-mode.js';

export const SERVICE_TYPE_LOOKUP = Symbol('CATALOG_SERVICE_TYPE_LOOKUP');

export interface ServiceTypeSnapshot {
  minimumOrderAmount: number;
  deliveryFee: number;
}

/** A service type as the storefront shows it. */
export interface ServiceOffer extends ServiceTypeSnapshot {
  code: string;
  name: string;
  mode: ServiceMode;
}

/** Catalog's view of the restaurant's service types (attention context). */
export interface ServiceTypeLookupPort {
  /** The restaurant's first active service type of the mode; null when it offers none. */
  findActive(
    restaurantId: string,
    mode: ServiceMode,
  ): Promise<ServiceTypeSnapshot | null>;
  /** Active service types of the restaurant, in their display order. */
  listActive(restaurantId: string): Promise<ServiceOffer[]>;
}
