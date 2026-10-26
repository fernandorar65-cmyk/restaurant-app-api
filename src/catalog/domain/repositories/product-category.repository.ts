export const PRODUCT_CATEGORY_REPOSITORY = Symbol('PRODUCT_CATEGORY_REPOSITORY');

/** Many-to-many link between products and categories. */
export interface ProductCategoryRepository {
  findCategoryIds(productId: string): Promise<string[]>;
  exists(productId: string, categoryId: string): Promise<boolean>;
  add(productId: string, categoryId: string): Promise<void>;
  remove(productId: string, categoryId: string): Promise<boolean>;
}
