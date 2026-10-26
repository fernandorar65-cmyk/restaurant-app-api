import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Allergen } from '../../domain/entities/allergen.entity.js';
import { ProductIngredient } from '../../domain/entities/product-ingredient.entity.js';
import {
  DuplicateProductAllergenError,
  ProductAllergenNotFoundError,
  ProductIngredientNotFoundError,
} from '../../domain/exceptions/catalog.errors.js';
import { PRODUCT_ALLERGEN_REPOSITORY } from '../../domain/repositories/product-allergen.repository.js';
import type { ProductAllergenRepository } from '../../domain/repositories/product-allergen.repository.js';
import { PRODUCT_INGREDIENT_REPOSITORY } from '../../domain/repositories/product-ingredient.repository.js';
import type { ProductIngredientRepository } from '../../domain/repositories/product-ingredient.repository.js';
import { AllergensService } from '../allergens/allergens.service.js';
import { ProductsService } from '../products/products.service.js';

export interface IngredientInput {
  name?: string;
  sortOrder?: number;
  isVisible?: boolean;
}

/** What a product contains: its allergens and the ingredients shown on the menu. */
@Injectable()
export class ProductCompositionService {
  constructor(
    @Inject(PRODUCT_ALLERGEN_REPOSITORY)
    private readonly productAllergenRepository: ProductAllergenRepository,
    @Inject(PRODUCT_INGREDIENT_REPOSITORY)
    private readonly ingredientRepository: ProductIngredientRepository,
    private readonly productsService: ProductsService,
    private readonly allergensService: AllergensService,
  ) {}

  async listAllergens(productId: string): Promise<Allergen[]> {
    await this.productsService.findOne(productId);
    const ids = await this.productAllergenRepository.findAllergenIds(productId);
    return this.allergensService.findByIds(ids);
  }

  async addAllergen(productId: string, allergenId: string): Promise<Allergen> {
    await this.productsService.findOne(productId);
    const allergen = await this.allergensService.findOne(allergenId);
    if (await this.productAllergenRepository.exists(productId, allergenId)) {
      throw new DuplicateProductAllergenError();
    }
    await this.productAllergenRepository.add(productId, allergenId);
    return allergen;
  }

  async removeAllergen(productId: string, allergenId: string): Promise<void> {
    if (!(await this.productAllergenRepository.remove(productId, allergenId))) {
      throw new ProductAllergenNotFoundError();
    }
  }

  async listIngredients(productId: string): Promise<ProductIngredient[]> {
    await this.productsService.findOne(productId);
    return this.ingredientRepository.findByProduct(productId);
  }

  async addIngredient(
    productId: string,
    input: IngredientInput & { name: string },
  ): Promise<ProductIngredient> {
    await this.productsService.findOne(productId);
    return this.ingredientRepository.save(
      ProductIngredient.create({ id: randomUUID(), productId, ...input }),
    );
  }

  async updateIngredient(
    productId: string,
    ingredientId: string,
    input: IngredientInput,
  ): Promise<ProductIngredient> {
    const ingredient = await this.findIngredient(productId, ingredientId);
    ingredient.update(input);
    return this.ingredientRepository.save(ingredient);
  }

  async removeIngredient(productId: string, ingredientId: string): Promise<void> {
    await this.findIngredient(productId, ingredientId);
    await this.ingredientRepository.delete(ingredientId);
  }

  private async findIngredient(
    productId: string,
    ingredientId: string,
  ): Promise<ProductIngredient> {
    const ingredient = await this.ingredientRepository.findById(ingredientId);
    if (!ingredient || ingredient.productId !== productId) {
      throw new ProductIngredientNotFoundError(ingredientId);
    }
    return ingredient;
  }
}
