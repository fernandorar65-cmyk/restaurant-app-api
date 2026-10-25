import { Permission } from '../entities/permission.entity.js';

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');

export interface PermissionRepository {
  findById(id: string): Promise<Permission | null>;
  findByCode(code: string): Promise<Permission | null>;
  findByIds(ids: string[]): Promise<Permission[]>;
  findAll(): Promise<Permission[]>;
  save(permission: Permission): Promise<Permission>;
  delete(id: string): Promise<boolean>;
}
