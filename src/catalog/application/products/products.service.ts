import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Product } from '../../domain/entities/product.entity.js';
import type { ProductDetails } from '../../domain/entities/product.entity.js';
import { ProductStatus } from '../../domain/enums/product-status.enum.js';
import {
  CrossRestaurantReferenceError,
  DuplicateProductCodeError,
  ProductNotFoundError,
} from '../../domain/exceptions/catalog.errors.js';
import { PRODUCT_REPOSITORY } from '../../domain/repositories/product.repository.js';
import type { ProductRepository } from '../../domain/repositories/product.repository.js';
import { ProductCategoriesService } from '../product-categories/product-categories.service.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export interface CreateProductInput extends ProductDetails {
  categoryId: string;
  code: string;
  name: string;
  price: number;
}

export interface UpdateProductInput extends ProductDetails {
  categoryId?: string;
  status?: ProductStatus;
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly categoriesService: ProductCategoriesService,
  ) {}

  /** The restaurant is taken from the category, so they can never disagree. */
  async create(input: CreateProductInput): Promise<Product> {
    const category = await this.categoriesService.findOne(input.categoryId);
    const product = Product.create({
      ...input,
      id: randomUUID(),
      restaurantId: category.restaurantId,
    });
    await this.assertCodeIsFree(product);
    return this.productRepository.save(product);
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
    if (input.categoryId) {
      const category = await this.categoriesService.findOne(input.categoryId);
      if (category.restaurantId !== product.restaurantId) {
        throw new CrossRestaurantReferenceError('La categoría');
      }
    }
    product.update(input);
    await this.assertCodeIsFree(product);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.productRepository.delete(id);
    if (!deleted) {
      throw new ProductNotFoundError(id);
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
