import { ProductCategory } from '../../../../domain/entities/product-category.entity.js';
import { ProductCategoryOrmEntity } from '../entities/product-category.orm-entity.js';

export class ProductCategoryMapper {
  static toDomain(orm: ProductCategoryOrmEntity): ProductCategory {
    return ProductCategory.fromPersistence({
      id: orm.id,
      restaurantId: orm.restaurantId,
      name: orm.name,
      description: orm.description,
      sortOrder: orm.sortOrder,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: ProductCategory,
    existing?: ProductCategoryOrmEntity,
  ): ProductCategoryOrmEntity {
    const orm = existing ?? new ProductCategoryOrmEntity();
    orm.id = domain.id;
    orm.restaurantId = domain.restaurantId;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.sortOrder = domain.sortOrder;
    orm.isActive = domain.isActive;
    return orm;
  }
}
