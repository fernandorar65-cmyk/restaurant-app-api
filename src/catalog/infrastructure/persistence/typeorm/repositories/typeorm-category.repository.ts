import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Category } from '../../../../domain/entities/category.entity.js';
import {
  CategoryFilter,
  CategoryRepository,
} from '../../../../domain/repositories/category.repository.js';
import { CategoryOrmEntity } from '../entities/category.orm-entity.js';
import { CategoryMapper } from '../mappers/category.mappers.js';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';

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

  protected toPersistence(domain: Category, existing?: CategoryOrmEntity): CategoryOrmEntity {
    return CategoryMapper.toPersistence(domain, existing);
  }

  findPage(filter: CategoryFilter, page: PageRequest): Promise<Page<Category>> {
    return this.findPageBy(
      {
        where: {
          organizationId: filter.organizationId,
          parentCategoryId:
            filter.parentCategoryId === null ? IsNull() : filter.parentCategoryId,
          isActive: filter.isActive,
        },
        order: { name: 'ASC' },
      },
      page,
    );
  }

  async findByIds(ids: string[]): Promise<Category[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.repository.find({ where: { id: In(ids) }, order: { name: 'ASC' } });
    return rows.map((row) => this.toDomain(row));
  }

  /** citext column: the comparison already ignores case. */
  async findByName(
    organizationId: string,
    parentCategoryId: string | null,
    name: string,
  ): Promise<Category | null> {
    const found = await this.repository.findOne({
      where: {
        organizationId,
        parentCategoryId: parentCategoryId ?? IsNull(),
        name,
      },
    });
    return found ? this.toDomain(found) : null;
  }
}
