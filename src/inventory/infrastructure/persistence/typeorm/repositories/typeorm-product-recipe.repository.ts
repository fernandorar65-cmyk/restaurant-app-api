import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductRecipe } from '../../../../domain/entities/product-recipe.entity.js';
import { ProductRecipeRepository } from '../../../../domain/repositories/product-recipe.repository.js';
import { ProductRecipeOrmEntity } from '../entities/product-recipe.orm-entity.js';
import { ProductRecipeMapper } from '../mappers/inventory.mappers.js';

@Injectable()
export class TypeOrmProductRecipeRepository implements ProductRecipeRepository {
  constructor(
    @InjectRepository(ProductRecipeOrmEntity)
    private readonly repository: Repository<ProductRecipeOrmEntity>,
  ) {}

  async find(productId: string, supplyId: string): Promise<ProductRecipe | null> {
    const found = await this.repository.findOne({ where: { productId, supplyId } });
    return found ? ProductRecipeMapper.toDomain(found) : null;
  }

  async findByProduct(productId: string): Promise<ProductRecipe[]> {
    const rows = await this.repository.find({ where: { productId } });
    return rows.map((row) => ProductRecipeMapper.toDomain(row));
  }

  async save(recipe: ProductRecipe): Promise<ProductRecipe> {
    const existing = await this.repository.findOne({
      where: { productId: recipe.productId, supplyId: recipe.supplyId },
    });
    const saved = await this.repository.save(
      ProductRecipeMapper.toPersistence(recipe, existing ?? undefined),
    );
    return ProductRecipeMapper.toDomain(saved);
  }

  async delete(productId: string, supplyId: string): Promise<boolean> {
    const result = await this.repository.delete({ productId, supplyId });
    return (result.affected ?? 0) > 0;
  }
}
