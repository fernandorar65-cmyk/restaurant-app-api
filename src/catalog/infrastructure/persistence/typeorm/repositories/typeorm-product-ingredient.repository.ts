import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { ProductIngredient } from '../../../../domain/entities/product-ingredient.entity.js';
import { ProductIngredientRepository } from '../../../../domain/repositories/product-ingredient.repository.js';
import { ProductIngredientOrmEntity } from '../entities/product-ingredient.orm-entity.js';
import { ProductIngredientMapper } from '../mappers/composition.mappers.js';

@Injectable()
export class TypeOrmProductIngredientRepository
  extends TypeOrmBaseRepository<ProductIngredient, ProductIngredientOrmEntity>
  implements ProductIngredientRepository
{
  constructor(
    @InjectRepository(ProductIngredientOrmEntity)
    repository: Repository<ProductIngredientOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: ProductIngredientOrmEntity): ProductIngredient {
    return ProductIngredientMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: ProductIngredient,
    existing?: ProductIngredientOrmEntity,
  ): ProductIngredientOrmEntity {
    return ProductIngredientMapper.toPersistence(domain, existing);
  }

  async findByProduct(productId: string): Promise<ProductIngredient[]> {
    const rows = await this.repository.find({
      where: { productId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }
}
