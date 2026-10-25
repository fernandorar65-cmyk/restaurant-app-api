import { Product } from '../../../../domain/entities/product.entity.js';
import { ProductOrmEntity } from '../entities/product.orm-entity.js';

export class ProductMapper {
  static toDomain(orm: ProductOrmEntity): Product {
    return Product.fromPersistence({
      id: orm.id,
      restaurantId: orm.restaurantId,
      categoryId: orm.categoryId,
      code: orm.code,
      name: orm.name,
      description: orm.description,
      imageUrl: orm.imageUrl,
      price: orm.price,
      preparationMinutes: orm.preparationMinutes,
      isAvailable: orm.isAvailable,
      isTakeawayAllowed: orm.isTakeawayAllowed,
      isDeliveryAllowed: orm.isDeliveryAllowed,
      status: orm.status,
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
    orm.restaurantId = domain.restaurantId;
    orm.categoryId = domain.categoryId;
    orm.code = domain.code;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.imageUrl = domain.imageUrl;
    orm.price = domain.price;
    orm.preparationMinutes = domain.preparationMinutes;
    orm.isAvailable = domain.isAvailable;
    orm.isTakeawayAllowed = domain.isTakeawayAllowed;
    orm.isDeliveryAllowed = domain.isDeliveryAllowed;
    orm.status = domain.status;
    return orm;
  }
}
