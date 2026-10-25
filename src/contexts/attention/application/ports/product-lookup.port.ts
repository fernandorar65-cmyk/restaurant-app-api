export const PRODUCT_LOOKUP = Symbol('PRODUCT_LOOKUP');

export interface ProductSnapshot {
  id: string;
  price: number;
}

/**
 * Attention's own view of a product, limited to what it actually needs
 * (existence + current price to snapshot as unitPrice). Backed today by an
 * in-process adapter that calls organizations' ProductsService directly.
 */
export interface ProductLookupPort {
  findById(productId: string): Promise<ProductSnapshot | null>;
}
