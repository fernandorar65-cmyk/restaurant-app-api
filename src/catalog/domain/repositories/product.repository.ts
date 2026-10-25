import { Product } from '../entities/product.entity.js';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  findByCode(restaurantId: string, code: string): Promise<Product | null>;
  findAll(filter?: {
    restaurantId?: string;
    categoryId?: string;
  }): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  delete(id: string): Promise<boolean>;
}
