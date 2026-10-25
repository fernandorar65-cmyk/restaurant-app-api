import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RolePermission } from '../../domain/entities/role-permission.entity.js';
import {
  DuplicateRolePermissionError,
  RolePermissionNotFoundError,
} from '../../domain/exceptions/role-permission.errors.js';
import { ROLE_PERMISSION_REPOSITORY } from '../../domain/repositories/role-permission.repository.js';
import type { RolePermissionRepository } from '../../domain/repositories/role-permission.repository.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { RolesService } from '../roles/roles.service.js';

export interface CreateRolePermissionInput {
  roleId: string;
  permissionId: string;
}

@Injectable()
export class RolePermissionsService {
  constructor(
    @Inject(ROLE_PERMISSION_REPOSITORY)
    private readonly rolePermissionRepository: RolePermissionRepository,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(input: CreateRolePermissionInput): Promise<RolePermission> {
    await this.rolesService.findOne(input.roleId);
    await this.permissionsService.findOne(input.permissionId);

    const existing = await this.rolePermissionRepository.findByRoleAndPermission(
      input.roleId,
      input.permissionId,
    );
    if (existing) {
      throw new DuplicateRolePermissionError();
    }

    const rolePermission = RolePermission.create({
      id: randomUUID(),
      roleId: input.roleId,
      permissionId: input.permissionId,
    });
    return this.rolePermissionRepository.save(rolePermission);
  }

  findAll(): Promise<RolePermission[]> {
    return this.rolePermissionRepository.findAll();
  }

  async findOne(id: string): Promise<RolePermission> {
    const rolePermission = await this.rolePermissionRepository.findById(id);
    if (!rolePermission) {
      throw new RolePermissionNotFoundError(id);
    }
    return rolePermission;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.rolePermissionRepository.delete(id);
    if (!deleted) {
      throw new RolePermissionNotFoundError(id);
    }
  }
}
