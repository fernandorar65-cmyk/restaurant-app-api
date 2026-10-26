import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { ExpenseCategory } from '../../../../domain/entities/expense-category.entity.js';
import { ExpenseCategoryRepository } from '../../../../domain/repositories/expense-category.repository.js';
import { ExpenseCategoryOrmEntity } from '../entities/expense-category.orm-entity.js';
import { ExpenseCategoryMapper } from '../mappers/finance.mappers.js';

@Injectable()
export class TypeOrmExpenseCategoryRepository
  extends TypeOrmBaseRepository<ExpenseCategory, ExpenseCategoryOrmEntity>
  implements ExpenseCategoryRepository
{
  constructor(
    @InjectRepository(ExpenseCategoryOrmEntity)
    repository: Repository<ExpenseCategoryOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: ExpenseCategoryOrmEntity): ExpenseCategory {
    return ExpenseCategoryMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: ExpenseCategory,
    existing?: ExpenseCategoryOrmEntity,
  ): ExpenseCategoryOrmEntity {
    return ExpenseCategoryMapper.toPersistence(domain, existing);
  }

  findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<ExpenseCategory>> {
    return this.findPageBy(
      { where: { organizationId: filter.organizationId }, order: { name: 'ASC' } },
      page,
    );
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<ExpenseCategory | null> {
    const found = await this.repository.findOne({ where: { organizationId, name } });
    return found ? this.toDomain(found) : null;
  }
}
