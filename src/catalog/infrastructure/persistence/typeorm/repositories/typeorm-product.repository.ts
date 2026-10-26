import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Raw, Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Product } from '../../../../domain/entities/product.entity.js';
import { ProductRepository } from '../../../../domain/repositories/product.repository.js';
import { ProductOrmEntity } from '../entities/product.orm-entity.js';
import { ProductMapper } from '../mappers/product.mapper.js';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';

@Injectable()
export class TypeOrmProductRepository
  extends TypeOrmBaseRepository<Product, ProductOrmEntity>
  implements ProductRepository
{
  constructor(
    @InjectRepository(ProductOrmEntity)
    repository: Repository<ProductOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: ProductOrmEntity): Product {
    return ProductMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: Product,
    existing?: ProductOrmEntity,
  ): ProductOrmEntity {
    return ProductMapper.toPersistence(domain, existing);
  }

  async findPage(
    filter: { restaurantId?: string; categoryId?: string },
    page: PageRequest,
  ): Promise<Page<Product>> {
    return this.findPageBy({
      where: {
        restaurantId: filter.restaurantId,
        id: filter.categoryId
          ? Raw(
              (column) =>
                `${column} IN (SELECT product_id FROM product_categories WHERE category_id = :categoryId)`,
              { categoryId: filter.categoryId },
            )
          : undefined,
      },
      order: { name: 'ASC' },
    }, page);
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.repository.find({ where: { id: In(ids) } });
    return rows.map((row) => this.toDomain(row));
  }

  async findByCode(restaurantId: string, code: string): Promise<Product | null> {
    const found = await this.repository.findOne({ where: { restaurantId, code } });
    return found ? this.toDomain(found) : null;
  }
}
