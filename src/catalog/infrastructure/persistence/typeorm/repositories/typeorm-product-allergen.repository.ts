import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAllergenRepository } from '../../../../domain/repositories/product-allergen.repository.js';
import { ProductAllergenOrmEntity } from '../entities/product-allergen.orm-entity.js';

@Injectable()
export class TypeOrmProductAllergenRepository implements ProductAllergenRepository {
  constructor(
    @InjectRepository(ProductAllergenOrmEntity)
    private readonly repository: Repository<ProductAllergenOrmEntity>,
  ) {}

  exists(productId: string, allergenId: string): Promise<boolean> {
    return this.repository.exists({ where: { productId, allergenId } });
  }

  async findAllergenIds(productId: string): Promise<string[]> {
    const rows = await this.repository.find({ where: { productId } });
    return rows.map((row) => row.allergenId);
  }

  async add(productId: string, allergenId: string): Promise<void> {
    await this.repository.insert({ productId, allergenId });
  }

  async remove(productId: string, allergenId: string): Promise<boolean> {
    const result = await this.repository.delete({ productId, allergenId });
    return (result.affected ?? 0) > 0;
  }
}
