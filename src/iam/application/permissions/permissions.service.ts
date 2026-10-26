import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Permission } from '../../domain/entities/permission.entity.js';
import {
  DuplicatePermissionCodeError,
  PermissionNotFoundError,
} from '../../domain/exceptions/permission.errors.js';
import { PERMISSION_REPOSITORY } from '../../domain/repositories/permission.repository.js';
import type { PermissionRepository } from '../../domain/repositories/permission.repository.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export interface CreatePermissionInput {
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdatePermissionInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async create(input: CreatePermissionInput): Promise<Permission> {
    const permission = Permission.create({ id: randomUUID(), ...input });
    const existing = await this.permissionRepository.findByCode(permission.code);
    if (existing) {
      throw new DuplicatePermissionCodeError(permission.code);
    }
    return this.permissionRepository.save(permission);
  }

  findPage(page: PageRequest): Promise<Page<Permission>> {
    return this.permissionRepository.findPage(page);
  }

  findByIds(ids: string[]): Promise<Permission[]> {
    return this.permissionRepository.findByIds(ids);
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
    permission.update(input);
    return this.permissionRepository.save(permission);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.permissionRepository.delete(id);
    if (!deleted) {
      throw new PermissionNotFoundError(id);
    }
  }
}
