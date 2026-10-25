import { Permission } from '../entities/permission.entity.js';

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');

export interface PermissionRepository {
  findById(id: string): Promise<Permission | null>;
  findByName(name: string): Promise<Permission | null>;
  findAll(): Promise<Permission[]>;
  save(permission: Permission): Promise<Permission>;
  delete(id: string): Promise<boolean>;
}
