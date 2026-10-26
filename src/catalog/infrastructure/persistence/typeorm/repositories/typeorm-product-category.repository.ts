import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategoryRepository } from '../../../../domain/repositories/product-category.repository.js';
import { ProductCategoryOrmEntity } from '../entities/product-category.orm-entity.js';

@Injectable()
export class TypeOrmProductCategoryRepository implements ProductCategoryRepository {
  constructor(
    @InjectRepository(ProductCategoryOrmEntity)
    private readonly repository: Repository<ProductCategoryOrmEntity>,
  ) {}

  async findCategoryIds(productId: string): Promise<string[]> {
    const rows = await this.repository.find({ where: { productId } });
    return rows.map((row) => row.categoryId);
  }

  exists(productId: string, categoryId: string): Promise<boolean> {
    return this.repository.exists({ where: { productId, categoryId } });
  }

  async add(productId: string, categoryId: string): Promise<void> {
    await this.repository.insert({ productId, categoryId });
  }

  async remove(productId: string, categoryId: string): Promise<boolean> {
    const result = await this.repository.delete({ productId, categoryId });
    return (result.affected ?? 0) > 0;
  }
}
