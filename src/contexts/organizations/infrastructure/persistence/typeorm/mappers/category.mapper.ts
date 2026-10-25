import { Category } from '../../../../domain/entities/category.entity.js';
import { CategoryOrmEntity } from '../entities/category.orm-entity.js';

export class CategoryMapper {
  static toDomain(orm: CategoryOrmEntity): Category {
    return Category.fromPersistence({
      id: orm.id,
      name: orm.name,
      description: orm.description ?? null,
      menuId: orm.menuId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: Category,
    existing?: CategoryOrmEntity,
  ): CategoryOrmEntity {
    const orm = existing ?? new CategoryOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.description = domain.description ?? undefined;
    orm.menuId = domain.menuId;
    return orm;
  }
}
