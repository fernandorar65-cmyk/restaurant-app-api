import { Role } from '../entities/role.entity.js';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByCode(organizationId: string, code: string): Promise<Role | null>;
  findAll(filter?: { organizationId?: string }): Promise<Role[]>;
  save(role: Role): Promise<Role>;
  delete(id: string): Promise<boolean>;
}
