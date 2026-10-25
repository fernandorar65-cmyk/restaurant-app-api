import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { ProductCategory } from '../../../../domain/entities/product-category.entity.js';
import { ProductCategoryRepository } from '../../../../domain/repositories/product-category.repository.js';
import { ProductCategoryOrmEntity } from '../entities/product-category.orm-entity.js';
import { ProductCategoryMapper } from '../mappers/product-category.mapper.js';

@Injectable()
export class TypeOrmProductCategoryRepository
  extends TypeOrmBaseRepository<ProductCategory, ProductCategoryOrmEntity>
  implements ProductCategoryRepository
{
  constructor(
    @InjectRepository(ProductCategoryOrmEntity)
    repository: Repository<ProductCategoryOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: ProductCategoryOrmEntity): ProductCategory {
    return ProductCategoryMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: ProductCategory,
    existing?: ProductCategoryOrmEntity,
  ): ProductCategoryOrmEntity {
    return ProductCategoryMapper.toPersistence(domain, existing);
  }

  override async findAll(
    filter: { restaurantId?: string } = {},
  ): Promise<ProductCategory[]> {
    const rows = await this.repository.find({
      where: { restaurantId: filter.restaurantId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByName(
    restaurantId: string,
    name: string,
  ): Promise<ProductCategory | null> {
    const found = await this.repository.findOne({ where: { restaurantId, name } });
    return found ? this.toDomain(found) : null;
  }
}
