import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ProductCategory } from '../../domain/entities/product-category.entity.js';
import {
  DuplicateProductCategoryNameError,
  ProductCategoryNotFoundError,
} from '../../domain/exceptions/catalog.errors.js';
import { PRODUCT_CATEGORY_REPOSITORY } from '../../domain/repositories/product-category.repository.js';
import type { ProductCategoryRepository } from '../../domain/repositories/product-category.repository.js';
import { RESTAURANT_LOOKUP } from '../ports/restaurant-lookup.port.js';
import type { RestaurantLookupPort } from '../ports/restaurant-lookup.port.js';
import { requireRestaurant } from '../restaurant-guard.js';

export interface CreateProductCategoryInput {
  restaurantId: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
}

export interface UpdateProductCategoryInput {
  name?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class ProductCategoriesService {
  constructor(
    @Inject(PRODUCT_CATEGORY_REPOSITORY)
    private readonly categoryRepository: ProductCategoryRepository,
    @Inject(RESTAURANT_LOOKUP)
    private readonly restaurantLookup: RestaurantLookupPort,
  ) {}

  async create(input: CreateProductCategoryInput): Promise<ProductCategory> {
    await requireRestaurant(this.restaurantLookup, input.restaurantId);
    const category = ProductCategory.create({ id: randomUUID(), ...input });
    await this.assertNameIsFree(category);
    return this.categoryRepository.save(category);
  }

  findAll(filter: { restaurantId?: string } = {}): Promise<ProductCategory[]> {
    return this.categoryRepository.findAll(filter);
  }

  async findOne(id: string): Promise<ProductCategory> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new ProductCategoryNotFoundError(id);
    }
    return category;
  }

  async update(
    id: string,
    input: UpdateProductCategoryInput,
  ): Promise<ProductCategory> {
    const category = await this.findOne(id);
    category.update(input);
    await this.assertNameIsFree(category);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.categoryRepository.delete(id);
    if (!deleted) {
      throw new ProductCategoryNotFoundError(id);
    }
  }

  private async assertNameIsFree(category: ProductCategory): Promise<void> {
    const existing = await this.categoryRepository.findByName(
      category.restaurantId,
      category.name,
    );
    if (existing && existing.id !== category.id) {
      throw new DuplicateProductCategoryNameError(category.name);
    }
  }
}
