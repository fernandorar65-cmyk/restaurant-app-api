import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from '../../../../domain/entities/menu.entity.js';
import { MenuRepository } from '../../../../domain/repositories/menu.repository.js';
import { MenuOrmEntity } from '../entities/menu.orm-entity.js';
import { MenuMapper } from '../mappers/menu.mapper.js';

@Injectable()
export class TypeOrmMenuRepository implements MenuRepository {
  constructor(
    @InjectRepository(MenuOrmEntity)
    private readonly repository: Repository<MenuOrmEntity>,
  ) {}

  async findById(id: string): Promise<Menu | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? MenuMapper.toDomain(found) : null;
  }

  async findAll(): Promise<Menu[]> {
    const rows = await this.repository.find();
    return rows.map(MenuMapper.toDomain);
  }

  async save(menu: Menu): Promise<Menu> {
    const existing = await this.repository.findOne({ where: { id: menu.id } });
    const orm = MenuMapper.toPersistence(menu, existing ?? undefined);
    const saved = await this.repository.save(orm);
    return MenuMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
