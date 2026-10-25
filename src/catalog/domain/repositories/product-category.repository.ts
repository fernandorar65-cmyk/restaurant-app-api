import { ProductCategory } from '../entities/product-category.entity.js';

export const PRODUCT_CATEGORY_REPOSITORY = Symbol('PRODUCT_CATEGORY_REPOSITORY');

export interface ProductCategoryRepository {
  findById(id: string): Promise<ProductCategory | null>;
  findByName(restaurantId: string, name: string): Promise<ProductCategory | null>;
  findAll(filter?: { restaurantId?: string }): Promise<ProductCategory[]>;
  save(category: ProductCategory): Promise<ProductCategory>;
  delete(id: string): Promise<boolean>;
}
