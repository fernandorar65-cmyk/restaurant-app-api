import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { MenuSection } from '../../../../domain/entities/menu-section.entity.js';
import { MenuSectionRepository } from '../../../../domain/repositories/menu-section.repository.js';
import { MenuSectionOrmEntity } from '../entities/menu-section.orm-entity.js';
import { MenuSectionMapper } from '../mappers/category.mappers.js';

@Injectable()
export class TypeOrmMenuSectionRepository
  extends TypeOrmBaseRepository<MenuSection, MenuSectionOrmEntity>
  implements MenuSectionRepository
{
  constructor(
    @InjectRepository(MenuSectionOrmEntity)
    repository: Repository<MenuSectionOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: MenuSectionOrmEntity): MenuSection {
    return MenuSectionMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: MenuSection,
    existing?: MenuSectionOrmEntity,
  ): MenuSectionOrmEntity {
    return MenuSectionMapper.toPersistence(domain, existing);
  }

  async findByMenu(menuId: string): Promise<MenuSection[]> {
    const rows = await this.repository.find({
      where: { menuId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  /** citext column: the comparison already ignores case. */
  async findByName(menuId: string, name: string): Promise<MenuSection | null> {
    const found = await this.repository.findOne({ where: { menuId, name } });
    return found ? this.toDomain(found) : null;
  }
}
