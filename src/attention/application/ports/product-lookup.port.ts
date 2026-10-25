import type { ServiceType } from '../../domain/enums/service-type.enum.js';

export const PRODUCT_LOOKUP = Symbol('PRODUCT_LOOKUP');

export interface ProductForOrder {
  id: string;
  restaurantId: string;
  /** Current catalog name and price, snapshotted onto the order item. */
  name: string;
  price: number;
  /** Why it can't be ordered for the service type, or null if it can. */
  issue: string | null;
}

/**
 * Attention's own view of the catalog: the server-side name/price of the
 * products and whether they can be ordered right now.
 */
export interface ProductLookupPort {
  findForOrder(
    productIds: string[],
    serviceType: ServiceType,
  ): Promise<ProductForOrder[]>;
}
