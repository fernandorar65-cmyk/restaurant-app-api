import { ProductIngredient } from '../../../../domain/entities/product-ingredient.entity.js';
import { ProductIngredientOrmEntity } from '../entities/product-ingredient.orm-entity.js';

export class ProductIngredientMapper {
  static toDomain(orm: ProductIngredientOrmEntity): ProductIngredient {
    return ProductIngredient.fromPersistence({
      id: orm.id,
      productId: orm.productId,
      name: orm.name,
      sortOrder: orm.sortOrder,
      isVisible: orm.isVisible,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: ProductIngredient,
    existing?: ProductIngredientOrmEntity,
  ): ProductIngredientOrmEntity {
    const orm = existing ?? new ProductIngredientOrmEntity();
    orm.id = domain.id;
    orm.productId = domain.productId;
    orm.name = domain.name;
    orm.sortOrder = domain.sortOrder;
    orm.isVisible = domain.isVisible;
    return orm;
  }
}
