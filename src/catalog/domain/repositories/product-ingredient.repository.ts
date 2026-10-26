import { ProductIngredient } from '../entities/product-ingredient.entity.js';

export const PRODUCT_INGREDIENT_REPOSITORY = Symbol('PRODUCT_INGREDIENT_REPOSITORY');

export interface ProductIngredientRepository {
  findById(id: string): Promise<ProductIngredient | null>;
  findByProduct(productId: string): Promise<ProductIngredient[]>;
  save(ingredient: ProductIngredient): Promise<ProductIngredient>;
  delete(id: string): Promise<boolean>;
}
