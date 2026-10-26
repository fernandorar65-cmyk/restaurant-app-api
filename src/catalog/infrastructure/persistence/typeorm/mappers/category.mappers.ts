import { Category } from '../../../../domain/entities/category.entity.js';
import { MenuSection } from '../../../../domain/entities/menu-section.entity.js';
import { CategoryOrmEntity } from '../entities/category.orm-entity.js';
import { MenuSectionOrmEntity } from '../entities/menu-section.orm-entity.js';

export class CategoryMapper {
  static toDomain(orm: CategoryOrmEntity): Category {
    return Category.fromPersistence({
      id: orm.id,
      organizationId: orm.organizationId,
      parentCategoryId: orm.parentCategoryId,
      name: orm.name,
      description: orm.description,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: Category, existing?: CategoryOrmEntity): CategoryOrmEntity {
    const orm = existing ?? new CategoryOrmEntity();
    orm.id = domain.id;
    orm.organizationId = domain.organizationId;
    orm.parentCategoryId = domain.parentCategoryId;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.isActive = domain.isActive;
    return orm;
  }
}

export class MenuSectionMapper {
  static toDomain(orm: MenuSectionOrmEntity): MenuSection {
    return MenuSection.fromPersistence({
      id: orm.id,
      menuId: orm.menuId,
      categoryId: orm.categoryId,
      name: orm.name,
      sortOrder: orm.sortOrder,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: MenuSection, existing?: MenuSectionOrmEntity): MenuSectionOrmEntity {
    const orm = existing ?? new MenuSectionOrmEntity();
    orm.id = domain.id;
    orm.menuId = domain.menuId;
    orm.categoryId = domain.categoryId;
    orm.name = domain.name;
    orm.sortOrder = domain.sortOrder;
    orm.isActive = domain.isActive;
    return orm;
  }
}
