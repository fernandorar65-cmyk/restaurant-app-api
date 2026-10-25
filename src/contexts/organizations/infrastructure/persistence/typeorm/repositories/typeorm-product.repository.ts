import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../../domain/entities/product.entity.js';
import { ProductRepository } from '../../../../domain/repositories/product.repository.js';
import { ProductOrmEntity } from '../entities/product.orm-entity.js';
import { ProductMapper } from '../mappers/product.mapper.js';

@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  async findById(id: string): Promise<Product | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? ProductMapper.toDomain(found) : null;
  }

  async findAll(): Promise<Product[]> {
    const rows = await this.repository.find();
    return rows.map(ProductMapper.toDomain);
  }

  async save(product: Product): Promise<Product> {
    const existing = await this.repository.findOne({
      where: { id: product.id },
    });
    const orm = ProductMapper.toPersistence(product, existing ?? undefined);
    const saved = await this.repository.save(orm);
    return ProductMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
