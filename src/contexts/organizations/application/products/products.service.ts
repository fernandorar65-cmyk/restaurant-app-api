import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Product } from '../../domain/entities/product.entity.js';
import { ProductNotFoundError } from '../../domain/exceptions/product.errors.js';
import { PRODUCT_REPOSITORY } from '../../domain/repositories/product.repository.js';
import type { ProductRepository } from '../../domain/repositories/product.repository.js';
import { CategoriesService } from '../categories/categories.service.js';

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  available?: boolean;
  categoryId: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  available?: boolean;
  categoryId?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(input: CreateProductInput): Promise<Product> {
    await this.categoriesService.findOne(input.categoryId);
    const product = Product.create({ id: randomUUID(), ...input });
    return this.productRepository.save(product);
  }

  findAll(): Promise<Product[]> {
    return this.productRepository.findAll();
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
      await this.categoriesService.findOne(input.categoryId);
    }
    product.update(input);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.productRepository.delete(id);
    if (!deleted) {
      throw new ProductNotFoundError(id);
    }
  }
}
