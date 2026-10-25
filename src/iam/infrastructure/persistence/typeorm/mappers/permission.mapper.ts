import { Permission } from '../../../../domain/entities/permission.entity.js';
import { PermissionOrmEntity } from '../entities/permission.orm-entity.js';

export class PermissionMapper {
  static toDomain(orm: PermissionOrmEntity): Permission {
    return Permission.fromPersistence({
      id: orm.id,
      code: orm.code,
      name: orm.name,
      description: orm.description,
      isActive: orm.isActive,
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
    orm.code = domain.code;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.isActive = domain.isActive;
    return orm;
  }
}
