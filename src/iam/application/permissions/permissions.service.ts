import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Permission } from '../../domain/entities/permission.entity.js';
import {
  DuplicatePermissionNameError,
  PermissionNotFoundError,
} from '../../domain/exceptions/permission.errors.js';
import { PERMISSION_REPOSITORY } from '../../domain/repositories/permission.repository.js';
import type { PermissionRepository } from '../../domain/repositories/permission.repository.js';

export interface CreatePermissionInput {
  name: string;
  description?: string;
}

export interface UpdatePermissionInput {
  name?: string;
  description?: string;
}

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async create(input: CreatePermissionInput): Promise<Permission> {
    const existing = await this.permissionRepository.findByName(input.name);
    if (existing) {
      throw new DuplicatePermissionNameError(input.name);
    }
    const permission = Permission.create({ id: randomUUID(), ...input });
    return this.permissionRepository.save(permission);
  }

  findAll(): Promise<Permission[]> {
    return this.permissionRepository.findAll();
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new PermissionNotFoundError(id);
    }
    return permission;
  }

  async update(id: string, input: UpdatePermissionInput): Promise<Permission> {
    const permission = await this.findOne(id);
    if (input.name) {
      const existing = await this.permissionRepository.findByName(input.name);
      if (existing && existing.id !== permission.id) {
        throw new DuplicatePermissionNameError(input.name);
      }
      permission.rename(input.name);
    }
    if (input.description !== undefined) {
      permission.changeDescription(input.description);
    }
    return this.permissionRepository.save(permission);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.permissionRepository.delete(id);
    if (!deleted) {
      throw new PermissionNotFoundError(id);
    }
  }
}
