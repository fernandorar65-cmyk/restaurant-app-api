import { RolePermission } from '../entities/role-permission.entity.js';

export const ROLE_PERMISSION_REPOSITORY = Symbol('ROLE_PERMISSION_REPOSITORY');

export interface RolePermissionRepository {
  find(roleId: string, permissionId: string): Promise<RolePermission | null>;
  findByRole(roleId: string): Promise<RolePermission[]>;
  save(rolePermission: RolePermission): Promise<RolePermission>;
  delete(roleId: string, permissionId: string): Promise<boolean>;
}
