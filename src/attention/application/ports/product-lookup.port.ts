export const PRODUCT_LOOKUP = Symbol('PRODUCT_LOOKUP');

export interface ProductSnapshot {
  id: string;
  name: string;
  price: number;
  available: boolean;
  categoryId: string;
}

/**
 * Attention's own view of a product, limited to what it actually needs
 * (existence + current name/price to snapshot on the order item). Backed
 * today by an in-process adapter that calls organizations' ProductsService
 * directly.
 */
export interface ProductLookupPort {
  findById(productId: string): Promise<ProductSnapshot | null>;
}
