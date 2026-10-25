import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Role } from '../../domain/entities/role.entity.js';
import { DuplicateRoleNameError, RoleNotFoundError } from '../../domain/exceptions/role.errors.js';
import { ROLE_REPOSITORY } from '../../domain/repositories/role.repository.js';
import type { RoleRepository } from '../../domain/repositories/role.repository.js';

export interface CreateRoleInput {
  name: string;
  description?: string;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
}

@Injectable()
export class RolesService {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
  ) {}

  async create(input: CreateRoleInput): Promise<Role> {
    const existing = await this.roleRepository.findByName(input.name);
    if (existing) {
      throw new DuplicateRoleNameError(input.name);
    }
    const role = Role.create({ id: randomUUID(), ...input });
    return this.roleRepository.save(role);
  }

  findAll(): Promise<Role[]> {
    return this.roleRepository.findAll();
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
    if (input.name) {
      const existing = await this.roleRepository.findByName(input.name);
      if (existing && existing.id !== role.id) {
        throw new DuplicateRoleNameError(input.name);
      }
      role.rename(input.name);
    }
    if (input.description !== undefined) {
      role.changeDescription(input.description);
    }
    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.roleRepository.delete(id);
    if (!deleted) {
      throw new RoleNotFoundError(id);
    }
  }
}
