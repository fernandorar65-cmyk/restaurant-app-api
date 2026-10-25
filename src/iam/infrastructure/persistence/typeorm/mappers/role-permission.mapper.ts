import { RolePermission } from '../../../../domain/entities/role-permission.entity.js';
import { RolePermissionOrmEntity } from '../entities/role-permission.orm-entity.js';

export class RolePermissionMapper {
  static toDomain(orm: RolePermissionOrmEntity): RolePermission {
    return RolePermission.fromPersistence({
      roleId: orm.roleId,
      permissionId: orm.permissionId,
      createdAt: orm.createdAt,
    });
  }

  static toPersistence(domain: RolePermission): RolePermissionOrmEntity {
    const orm = new RolePermissionOrmEntity();
    orm.roleId = domain.roleId;
    orm.permissionId = domain.permissionId;
    return orm;
  }
}
