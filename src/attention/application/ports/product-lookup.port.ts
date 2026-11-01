import type { FulfillmentMode } from '../../domain/enums/fulfillment-mode.enum.js';
import type { OrderableProduct } from '../../domain/services/orderable-products.js';

export const PRODUCT_LOOKUP = Symbol('PRODUCT_LOOKUP');

export type ProductForOrder = OrderableProduct;

/**
 * Attention's own view of the catalog: the server-side name/price of the
 * products and whether they can be ordered right now.
 */
export interface ProductLookupPort {
  findForOrder(
    productIds: string[],
    fulfillmentMode: FulfillmentMode,
  ): Promise<ProductForOrder[]>;
}
