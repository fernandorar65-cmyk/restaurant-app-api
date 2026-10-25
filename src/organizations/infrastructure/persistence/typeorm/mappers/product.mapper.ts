import { Product } from '../../../../domain/entities/product.entity.js';
import { ProductOrmEntity } from '../entities/product.orm-entity.js';

export class ProductMapper {
  static toDomain(orm: ProductOrmEntity): Product {
    return Product.fromPersistence({
      id: orm.id,
      name: orm.name,
      description: orm.description ?? null,
      price: Number(orm.price),
      available: orm.available,
      categoryId: orm.categoryId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: Product,
    existing?: ProductOrmEntity,
  ): ProductOrmEntity {
    const orm = existing ?? new ProductOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.description = domain.description ?? undefined;
    orm.price = domain.price;
    orm.available = domain.available;
    orm.categoryId = domain.categoryId;
    return orm;
  }
}
