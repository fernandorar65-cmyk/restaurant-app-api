import { Inject, Injectable } from '@nestjs/common';
import { ProductRecipe } from '../../domain/entities/product-recipe.entity.js';
import {
  InactiveSupplyError,
  ProductReferenceNotFoundError,
  RecipeLineNotFoundError,
  RecipeSupplyFromAnotherOrganizationError,
} from '../../domain/exceptions/inventory.errors.js';
import { PRODUCT_RECIPE_REPOSITORY } from '../../domain/repositories/product-recipe.repository.js';
import type { ProductRecipeRepository } from '../../domain/repositories/product-recipe.repository.js';
import { ORGANIZATION_LOOKUP } from '../ports/organization-lookup.port.js';
import type { OrganizationLookupPort } from '../ports/organization-lookup.port.js';
import { PRODUCT_LOOKUP } from '../ports/product-lookup.port.js';
import type { ProductLookupPort } from '../ports/product-lookup.port.js';
import { SuppliesService } from '../supplies/supplies.service.js';

/**
 * Recipes reference the organization's master supplies, never the stock of
 * one restaurant: each restaurant resolves its own stock when consuming.
 * Optional until the automatic discount flow is confirmed.
 */
@Injectable()
export class ProductRecipesService {
  constructor(
    @Inject(PRODUCT_RECIPE_REPOSITORY)
    private readonly recipeRepository: ProductRecipeRepository,
    @Inject(PRODUCT_LOOKUP) private readonly productLookup: ProductLookupPort,
    @Inject(ORGANIZATION_LOOKUP) private readonly organizationLookup: OrganizationLookupPort,
    private readonly suppliesService: SuppliesService,
  ) {}

  async list(productId: string): Promise<ProductRecipe[]> {
    await this.requireProductRestaurant(productId);
    return this.recipeRepository.findByProduct(productId);
  }

  /** Adds or updates how much of the supply one unit of the product uses. */
  async setLine(
    productId: string,
    supplyId: string,
    input: { quantityRequired: number; wastePercentage?: number },
  ): Promise<ProductRecipe> {
    const restaurantId = await this.requireProductRestaurant(productId);
    const supply = await this.suppliesService.findOne(supplyId);
    const organizationId = await this.organizationLookup.findRestaurantOrganizationId(restaurantId);
    if (supply.organizationId !== organizationId) {
      throw new RecipeSupplyFromAnotherOrganizationError();
    }
    if (!supply.isActive) {
      throw new InactiveSupplyError(supply.id);
    }
    const existing = await this.recipeRepository.find(productId, supplyId);
    if (existing) {
      existing.update(input);
      return this.recipeRepository.save(existing);
    }
    return this.recipeRepository.save(
      ProductRecipe.create({ productId, supplyId, ...input }),
    );
  }

  async removeLine(productId: string, supplyId: string): Promise<void> {
    if (!(await this.recipeRepository.delete(productId, supplyId))) {
      throw new RecipeLineNotFoundError();
    }
  }

  private async requireProductRestaurant(productId: string): Promise<string> {
    const restaurantId = await this.productLookup.findRestaurantId(productId);
    if (!restaurantId) {
      throw new ProductReferenceNotFoundError(productId);
    }
    return restaurantId;
  }
}
