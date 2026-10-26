export const PRODUCT_ALLERGEN_REPOSITORY = Symbol('PRODUCT_ALLERGEN_REPOSITORY');

/** Product <-> allergen links (pure association, no extra data). */
export interface ProductAllergenRepository {
  exists(productId: string, allergenId: string): Promise<boolean>;
  findAllergenIds(productId: string): Promise<string[]>;
  add(productId: string, allergenId: string): Promise<void>;
  remove(productId: string, allergenId: string): Promise<boolean>;
}
