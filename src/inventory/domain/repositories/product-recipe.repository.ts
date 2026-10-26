import { ProductRecipe } from '../entities/product-recipe.entity.js';

export const PRODUCT_RECIPE_REPOSITORY = Symbol('PRODUCT_RECIPE_REPOSITORY');

export interface ProductRecipeRepository {
  find(productId: string, supplyId: string): Promise<ProductRecipe | null>;
  findByProduct(productId: string): Promise<ProductRecipe[]>;
  save(recipe: ProductRecipe): Promise<ProductRecipe>;
  delete(productId: string, supplyId: string): Promise<boolean>;
}
