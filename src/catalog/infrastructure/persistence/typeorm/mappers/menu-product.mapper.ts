import { MenuProduct } from '../../../../domain/entities/menu-product.entity.js';
import { MenuProductOrmEntity } from '../entities/menu-product.orm-entity.js';

export class MenuProductMapper {
  static toDomain(orm: MenuProductOrmEntity): MenuProduct {
    return MenuProduct.fromPersistence({
      menuId: orm.menuId,
      productId: orm.productId,
      displayPrice: orm.displayPrice,
      sortOrder: orm.sortOrder,
      isVisible: orm.isVisible,
      createdAt: orm.createdAt,
    });
  }

  static toPersistence(
    domain: MenuProduct,
    existing?: MenuProductOrmEntity,
  ): MenuProductOrmEntity {
    const orm = existing ?? new MenuProductOrmEntity();
    orm.menuId = domain.menuId;
    orm.productId = domain.productId;
    orm.displayPrice = domain.displayPrice;
    orm.sortOrder = domain.sortOrder;
    orm.isVisible = domain.isVisible;
    return orm;
  }
}
