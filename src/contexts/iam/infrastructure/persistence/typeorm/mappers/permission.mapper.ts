import { Permission } from '../../../../domain/entities/permission.entity.js';
import { PermissionOrmEntity } from '../entities/permission.orm-entity.js';

export class PermissionMapper {
  static toDomain(orm: PermissionOrmEntity): Permission {
    return Permission.fromPersistence({
      id: orm.id,
      name: orm.name,
      description: orm.description ?? null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: Permission,
    existing?: PermissionOrmEntity,
  ): PermissionOrmEntity {
    const orm = existing ?? new PermissionOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.description = domain.description;
    return orm;
  }
}
