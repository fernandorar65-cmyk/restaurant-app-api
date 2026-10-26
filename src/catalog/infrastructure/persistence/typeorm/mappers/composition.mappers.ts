import { Allergen } from '../../../../domain/entities/allergen.entity.js';
import { ProductIngredient } from '../../../../domain/entities/product-ingredient.entity.js';
import { AllergenOrmEntity } from '../entities/allergen.orm-entity.js';
import { ProductIngredientOrmEntity } from '../entities/product-ingredient.orm-entity.js';

export class AllergenMapper {
  static toDomain(orm: AllergenOrmEntity): Allergen {
    return Allergen.fromPersistence({
      id: orm.id,
      code: orm.code,
      name: orm.name,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: Allergen, existing?: AllergenOrmEntity): AllergenOrmEntity {
    const orm = existing ?? new AllergenOrmEntity();
    orm.id = domain.id;
    orm.code = domain.code;
    orm.name = domain.name;
    return orm;
  }
}

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
