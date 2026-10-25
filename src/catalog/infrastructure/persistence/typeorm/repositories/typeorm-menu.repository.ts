import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Menu } from '../../../../domain/entities/menu.entity.js';
import { MenuRepository } from '../../../../domain/repositories/menu.repository.js';
import { MenuOrmEntity } from '../entities/menu.orm-entity.js';
import { MenuMapper } from '../mappers/menu.mapper.js';

@Injectable()
export class TypeOrmMenuRepository
  extends TypeOrmBaseRepository<Menu, MenuOrmEntity>
  implements MenuRepository
{
  constructor(
    @InjectRepository(MenuOrmEntity)
    repository: Repository<MenuOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: MenuOrmEntity): Menu {
    return MenuMapper.toDomain(orm);
  }

  protected toPersistence(domain: Menu, existing?: MenuOrmEntity): MenuOrmEntity {
    return MenuMapper.toPersistence(domain, existing);
  }

  override async findAll(filter: { restaurantId?: string } = {}): Promise<Menu[]> {
    const rows = await this.repository.find({
      where: { restaurantId: filter.restaurantId },
      order: { name: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByName(restaurantId: string, name: string): Promise<Menu | null> {
    const found = await this.repository.findOne({ where: { restaurantId, name } });
    return found ? this.toDomain(found) : null;
  }
}
