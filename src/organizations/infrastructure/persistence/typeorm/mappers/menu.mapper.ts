import { Menu } from '../../../../domain/entities/menu.entity.js';
import { MenuOrmEntity } from '../entities/menu.orm-entity.js';

export class MenuMapper {
  static toDomain(orm: MenuOrmEntity): Menu {
    return Menu.fromPersistence({
      id: orm.id,
      name: orm.name,
      description: orm.description ?? null,
      active: orm.active,
      restaurantId: orm.restaurantId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: Menu, existing?: MenuOrmEntity): MenuOrmEntity {
    const orm = existing ?? new MenuOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.description = domain.description ?? undefined;
    orm.active = domain.active;
    orm.restaurantId = domain.restaurantId;
    return orm;
  }
}
