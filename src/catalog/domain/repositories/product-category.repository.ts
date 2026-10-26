import { ProductCategory } from '../entities/product-category.entity.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export const PRODUCT_CATEGORY_REPOSITORY = Symbol('PRODUCT_CATEGORY_REPOSITORY');

export interface ProductCategoryRepository {
  findById(id: string): Promise<ProductCategory | null>;
  findByName(restaurantId: string, name: string): Promise<ProductCategory | null>;
  findPage(
    filter: { restaurantId?: string },
    page: PageRequest,
  ): Promise<Page<ProductCategory>>;
  save(category: ProductCategory): Promise<ProductCategory>;
  delete(id: string): Promise<boolean>;
}
