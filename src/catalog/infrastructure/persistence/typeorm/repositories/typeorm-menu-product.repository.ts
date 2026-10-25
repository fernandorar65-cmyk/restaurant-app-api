import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuProduct } from '../../../../domain/entities/menu-product.entity.js';
import { MenuProductRepository } from '../../../../domain/repositories/menu-product.repository.js';
import { MenuProductOrmEntity } from '../entities/menu-product.orm-entity.js';
import { MenuProductMapper } from '../mappers/menu-product.mapper.js';

@Injectable()
export class TypeOrmMenuProductRepository implements MenuProductRepository {
  constructor(
    @InjectRepository(MenuProductOrmEntity)
    private readonly repository: Repository<MenuProductOrmEntity>,
  ) {}

  async find(menuId: string, productId: string): Promise<MenuProduct | null> {
    const found = await this.repository.findOne({ where: { menuId, productId } });
    return found ? MenuProductMapper.toDomain(found) : null;
  }

  async findByMenu(menuId: string): Promise<MenuProduct[]> {
    const rows = await this.repository.find({
      where: { menuId },
      order: { sortOrder: 'ASC' },
    });
    return rows.map((row) => MenuProductMapper.toDomain(row));
  }

  async save(menuProduct: MenuProduct): Promise<MenuProduct> {
    const existing = await this.repository.findOne({
      where: { menuId: menuProduct.menuId, productId: menuProduct.productId },
    });
    const saved = await this.repository.save(
      MenuProductMapper.toPersistence(menuProduct, existing ?? undefined),
    );
    return MenuProductMapper.toDomain(saved);
  }

  async delete(menuId: string, productId: string): Promise<boolean> {
    const result = await this.repository.delete({ menuId, productId });
    return (result.affected ?? 0) > 0;
  }
}
