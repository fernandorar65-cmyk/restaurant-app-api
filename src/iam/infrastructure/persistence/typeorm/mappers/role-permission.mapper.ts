import { RolePermission } from '../../../../domain/entities/role-permission.entity.js';
import { RolePermissionOrmEntity } from '../entities/role-permission.orm-entity.js';

export class RolePermissionMapper {
  static toDomain(orm: RolePermissionOrmEntity): RolePermission {
    return RolePermission.fromPersistence({
      id: orm.id,
      roleId: orm.roleId,
      permissionId: orm.permissionId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: RolePermission,
    existing?: RolePermissionOrmEntity,
  ): RolePermissionOrmEntity {
    const orm = existing ?? new RolePermissionOrmEntity();
    orm.id = domain.id;
    orm.roleId = domain.roleId;
    orm.permissionId = domain.permissionId;
    return orm;
  }
}
