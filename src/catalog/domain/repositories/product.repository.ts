import { Product } from '../entities/product.entity.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  findByCode(restaurantId: string, code: string): Promise<Product | null>;
  findPage(
    filter: {
    restaurantId?: string;
    categoryId?: string;
  },
    page: PageRequest,
  ): Promise<Page<Product>>;
  save(product: Product): Promise<Product>;
  delete(id: string): Promise<boolean>;
}
