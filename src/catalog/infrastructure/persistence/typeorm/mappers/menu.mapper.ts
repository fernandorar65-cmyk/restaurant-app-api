import { Menu } from '../../../../domain/entities/menu.entity.js';
import { MenuOrmEntity } from '../entities/menu.orm-entity.js';

export class MenuMapper {
  static toDomain(orm: MenuOrmEntity): Menu {
    return Menu.fromPersistence({
      id: orm.id,
      restaurantId: orm.restaurantId,
      name: orm.name,
      description: orm.description,
      status: orm.status,
      validFrom: orm.validFrom,
      validUntil: orm.validUntil,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: Menu, existing?: MenuOrmEntity): MenuOrmEntity {
    const orm = existing ?? new MenuOrmEntity();
    orm.id = domain.id;
    orm.restaurantId = domain.restaurantId;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.status = domain.status;
    orm.validFrom = domain.validFrom;
    orm.validUntil = domain.validUntil;
    return orm;
  }
}
