import { Role } from '../entities/role.entity.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByCode(organizationId: string, code: string): Promise<Role | null>;
  findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<Role>>;
  save(role: Role): Promise<Role>;
  delete(id: string): Promise<boolean>;
}
