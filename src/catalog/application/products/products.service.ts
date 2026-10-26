import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Product } from '../../domain/entities/product.entity.js';
import type { ProductDetails } from '../../domain/entities/product.entity.js';
import { ProductStatus } from '../../domain/enums/product-status.enum.js';
import { Category } from '../../domain/entities/category.entity.js';
import {
  DuplicateProductCategoryError,
  DuplicateProductCodeError,
  ProductCategoryNotFoundError,
  ProductNotFoundError,
} from '../../domain/exceptions/catalog.errors.js';
import { PRODUCT_CATEGORY_REPOSITORY } from '../../domain/repositories/product-category.repository.js';
import type { ProductCategoryRepository } from '../../domain/repositories/product-category.repository.js';
import { PRODUCT_REPOSITORY } from '../../domain/repositories/product.repository.js';
import type { ProductRepository } from '../../domain/repositories/product.repository.js';
import { CategoriesService } from '../categories/categories.service.js';
import { RESTAURANT_LOOKUP } from '../ports/restaurant-lookup.port.js';
import type { RestaurantLookupPort } from '../ports/restaurant-lookup.port.js';
import { requireRestaurant } from '../restaurant-guard.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export interface CreateProductInput extends ProductDetails {
  restaurantId: string;
  /** Optional: a product can belong to zero or more categories. */
  categoryIds?: string[];
  code: string;
  name: string;
  price: number;
}

export interface UpdateProductInput extends ProductDetails {
  status?: ProductStatus;
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PRODUCT_CATEGORY_REPOSITORY)
    private readonly productCategoryRepository: ProductCategoryRepository,
    @Inject(RESTAURANT_LOOKUP)
    private readonly restaurantLookup: RestaurantLookupPort,
    private readonly categoriesService: CategoriesService,
  ) {}

  /** Categories are validated before saving, so a failure leaves nothing behind. */
  async create(input: CreateProductInput): Promise<Product> {
    const { categoryIds = [], ...details } = input;
    const restaurant = await requireRestaurant(this.restaurantLookup, input.restaurantId);
    const uniqueCategoryIds = [...new Set(categoryIds)];
    for (const categoryId of uniqueCategoryIds) {
      await this.categoriesService.findAssignable(restaurant.organizationId, categoryId);
    }
    const product = Product.create({ ...details, id: randomUUID() });
    await this.assertCodeIsFree(product);
    const saved = await this.productRepository.save(product);
    for (const categoryId of uniqueCategoryIds) {
      await this.productCategoryRepository.add(saved.id, categoryId);
    }
    return saved;
  }

  findPage(
    filter: { restaurantId?: string; categoryId?: string },
    page: PageRequest,
  ): Promise<Page<Product>> {
    return this.productRepository.findPage(filter, page);
  }

  findByIds(ids: string[]): Promise<Product[]> {
    return this.productRepository.findByIds(ids);
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundError(id);
    }
    return product;
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const product = await this.findOne(id);
    product.update(input);
    await this.assertCodeIsFree(product);
    return this.productRepository.save(product);
  }

  /**
   * Logical delete: operational history must be kept, so the record is
   * deactivated instead of removed.
   */
  async deactivate(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.update({ status: ProductStatus.INACTIVE });
    await this.productRepository.save(product);
  }

  async listCategories(productId: string): Promise<Category[]> {
    await this.findOne(productId);
    const ids = await this.productCategoryRepository.findCategoryIds(productId);
    return this.categoriesService.findByIds(ids);
  }

  /** Product (through its restaurant) and category must share the organization. */
  async addCategory(productId: string, categoryId: string): Promise<Category> {
    const product = await this.findOne(productId);
    const restaurant = await requireRestaurant(this.restaurantLookup, product.restaurantId);
    const category = await this.categoriesService.findAssignable(
      restaurant.organizationId,
      categoryId,
    );
    if (await this.productCategoryRepository.exists(productId, categoryId)) {
      throw new DuplicateProductCategoryError();
    }
    await this.productCategoryRepository.add(productId, categoryId);
    return category;
  }

  async removeCategory(productId: string, categoryId: string): Promise<void> {
    if (!(await this.productCategoryRepository.remove(productId, categoryId))) {
      throw new ProductCategoryNotFoundError();
    }
  }

  private async assertCodeIsFree(product: Product): Promise<void> {
    const existing = await this.productRepository.findByCode(
      product.restaurantId,
      product.code,
    );
    if (existing && existing.id !== product.id) {
      throw new DuplicateProductCodeError(product.code);
    }
  }
}
