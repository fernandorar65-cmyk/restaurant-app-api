import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { InventoryCategory } from '../../../../domain/entities/inventory-category.entity.js';
import { InventoryCategoryRepository } from '../../../../domain/repositories/inventory-category.repository.js';
import { InventoryCategoryOrmEntity } from '../entities/inventory-category.orm-entity.js';
import { InventoryCategoryMapper } from '../mappers/inventory.mappers.js';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';

@Injectable()
export class TypeOrmInventoryCategoryRepository
  extends TypeOrmBaseRepository<InventoryCategory, InventoryCategoryOrmEntity>
  implements InventoryCategoryRepository
{
  constructor(
    @InjectRepository(InventoryCategoryOrmEntity)
    repository: Repository<InventoryCategoryOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: InventoryCategoryOrmEntity): InventoryCategory {
    return InventoryCategoryMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: InventoryCategory,
    existing?: InventoryCategoryOrmEntity,
  ): InventoryCategoryOrmEntity {
    return InventoryCategoryMapper.toPersistence(domain, existing);
  }

  async findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<InventoryCategory>> {
    return this.findPageBy({
      where: { organizationId: filter.organizationId },
      order: { name: 'ASC' },
    }, page);
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<InventoryCategory | null> {
    const found = await this.repository.findOne({ where: { organizationId, name } });
    return found ? this.toDomain(found) : null;
  }
}
