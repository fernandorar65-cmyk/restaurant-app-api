import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Role } from '../../domain/entities/role.entity.js';
import { OrganizationReferenceNotFoundError } from '../../domain/exceptions/external-reference.errors.js';
import {
  DuplicateRoleCodeError,
  RoleNotFoundError,
} from '../../domain/exceptions/role.errors.js';
import { ROLE_REPOSITORY } from '../../domain/repositories/role.repository.js';
import type { RoleRepository } from '../../domain/repositories/role.repository.js';
import { ORGANIZATION_LOOKUP } from '../ports/organization-lookup.port.js';
import type { OrganizationLookupPort } from '../ports/organization-lookup.port.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export interface CreateRoleInput {
  organizationId: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

@Injectable()
export class RolesService {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    @Inject(ORGANIZATION_LOOKUP)
    private readonly organizationLookup: OrganizationLookupPort,
  ) {}

  async create(input: CreateRoleInput): Promise<Role> {
    if (!(await this.organizationLookup.organizationExists(input.organizationId))) {
      throw new OrganizationReferenceNotFoundError(input.organizationId);
    }
    const role = Role.create({ id: randomUUID(), ...input });
    const existing = await this.roleRepository.findByCode(
      role.organizationId,
      role.code,
    );
    if (existing) {
      throw new DuplicateRoleCodeError(role.code);
    }
    return this.roleRepository.save(role);
  }

  findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<Role>> {
    return this.roleRepository.findPage(filter, page);
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new RoleNotFoundError(id);
    }
    return role;
  }

  async update(id: string, input: UpdateRoleInput): Promise<Role> {
    const role = await this.findOne(id);
    role.update(input);
    return this.roleRepository.save(role);
  }

  /**
   * Logical delete: operational history must be kept, so the record is
   * deactivated instead of removed.
   */
  async deactivate(id: string): Promise<void> {
    const role = await this.findOne(id);
    role.update({ isActive: false });
    await this.roleRepository.save(role);
  }
}
