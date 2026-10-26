import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ProductIngredient } from '../../domain/entities/product-ingredient.entity.js';
import { ProductIngredientNotFoundError } from '../../domain/exceptions/catalog.errors.js';
import { PRODUCT_INGREDIENT_REPOSITORY } from '../../domain/repositories/product-ingredient.repository.js';
import type { ProductIngredientRepository } from '../../domain/repositories/product-ingredient.repository.js';
import { ProductsService } from '../products/products.service.js';

export interface IngredientInput {
  name?: string;
  sortOrder?: number;
  isVisible?: boolean;
}

/**
 * Optional composition of a product: the ingredients shown on the menu. Not
 * configuring them says nothing about allergens (out of the MVP).
 */
@Injectable()
export class ProductCompositionService {
  constructor(
    @Inject(PRODUCT_INGREDIENT_REPOSITORY)
    private readonly ingredientRepository: ProductIngredientRepository,
    private readonly productsService: ProductsService,
  ) {}

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
