import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Product } from '../../../../domain/entities/product.entity.js';
import { ProductRepository } from '../../../../domain/repositories/product.repository.js';
import { ProductOrmEntity } from '../entities/product.orm-entity.js';
import { ProductMapper } from '../mappers/product.mapper.js';

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
}
