import { RolePermission } from '../entities/role-permission.entity.js';

export const ROLE_PERMISSION_REPOSITORY = Symbol('ROLE_PERMISSION_REPOSITORY');

export interface RolePermissionRepository {
  findById(id: string): Promise<RolePermission | null>;
  findByRoleAndPermission(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermission | null>;
  findAll(): Promise<RolePermission[]>;
  save(rolePermission: RolePermission): Promise<RolePermission>;
  delete(id: string): Promise<boolean>;
}
