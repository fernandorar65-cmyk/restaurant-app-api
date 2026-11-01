import { ProductNotOrderableError } from '../exceptions/attention.errors.js';

/** A catalog product as an order needs it. */
export interface OrderableProduct {
  id: string;
  restaurantId: string;
  /** Current catalog name and price, snapshotted onto the order item. */
  name: string;
  price: number;
  /** Why it can't be ordered for the service type, or null if it can. */
  issue: string | null;
}

/**
 * Every line of an order must be a product of the attention's restaurant
 * that can be ordered right now. Returns the products by id.
 */
export function requireOrderableProducts(
  restaurantId: string,
  productIds: string[],
  products: OrderableProduct[],
): Map<string, OrderableProduct> {
  const byId = new Map(products.map((product) => [product.id, product]));
  for (const productId of productIds) {
    const product = byId.get(productId);
    if (!product) {
      throw new ProductNotOrderableError(productId, 'PRODUCT_NOT_FOUND');
    }
    if (product.restaurantId !== restaurantId) {
      throw new ProductNotOrderableError(
        productId,
        'PRODUCT_NOT_IN_RESTAURANT',
      );
    }
    if (product.issue) {
      throw new ProductNotOrderableError(productId, product.issue);
    }
  }
  return byId;
}
