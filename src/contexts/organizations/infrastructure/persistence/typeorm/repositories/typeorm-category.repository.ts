import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../../../domain/entities/category.entity.js';
import { CategoryRepository } from '../../../../domain/repositories/category.repository.js';
import { CategoryOrmEntity } from '../entities/category.orm-entity.js';
import { CategoryMapper } from '../mappers/category.mapper.js';

@Injectable()
export class TypeOrmCategoryRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repository: Repository<CategoryOrmEntity>,
  ) {}

  async findById(id: string): Promise<Category | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? CategoryMapper.toDomain(found) : null;
  }

  async findAll(): Promise<Category[]> {
    const rows = await this.repository.find();
    return rows.map(CategoryMapper.toDomain);
  }

  async save(category: Category): Promise<Category> {
    const existing = await this.repository.findOne({
      where: { id: category.id },
    });
    const orm = CategoryMapper.toPersistence(category, existing ?? undefined);
    const saved = await this.repository.save(orm);
    return CategoryMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
