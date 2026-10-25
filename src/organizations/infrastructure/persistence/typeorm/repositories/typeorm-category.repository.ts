import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Category } from '../../../../domain/entities/category.entity.js';
import { CategoryRepository } from '../../../../domain/repositories/category.repository.js';
import { CategoryOrmEntity } from '../entities/category.orm-entity.js';
import { CategoryMapper } from '../mappers/category.mapper.js';

@Injectable()
export class TypeOrmCategoryRepository
  extends TypeOrmBaseRepository<Category, CategoryOrmEntity>
  implements CategoryRepository
{
  constructor(
    @InjectRepository(CategoryOrmEntity)
    repository: Repository<CategoryOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: CategoryOrmEntity): Category {
    return CategoryMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: Category,
    existing?: CategoryOrmEntity,
  ): CategoryOrmEntity {
    return CategoryMapper.toPersistence(domain, existing);
  }
}
