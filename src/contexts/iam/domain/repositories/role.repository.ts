import { Role } from '../entities/role.entity.js';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  save(role: Role): Promise<Role>;
  delete(id: string): Promise<boolean>;
}
