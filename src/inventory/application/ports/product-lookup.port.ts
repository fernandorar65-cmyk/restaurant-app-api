export const PRODUCT_LOOKUP = Symbol('INVENTORY_PRODUCT_LOOKUP');

/** Inventory's own view of a catalog product: only which restaurant owns it. */
export interface ProductLookupPort {
  findRestaurantId(productId: string): Promise<string | null>;
}
