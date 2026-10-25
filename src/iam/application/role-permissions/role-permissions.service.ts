import { Inject, Injectable } from '@nestjs/common';
import { Permission } from '../../domain/entities/permission.entity.js';
import { RolePermission } from '../../domain/entities/role-permission.entity.js';
import {
  DuplicateRolePermissionError,
  RolePermissionNotFoundError,
} from '../../domain/exceptions/role-permission.errors.js';
import { ROLE_PERMISSION_REPOSITORY } from '../../domain/repositories/role-permission.repository.js';
import type { RolePermissionRepository } from '../../domain/repositories/role-permission.repository.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { RolesService } from '../roles/roles.service.js';

@Injectable()
export class RolePermissionsService {
  constructor(
    @Inject(ROLE_PERMISSION_REPOSITORY)
    private readonly rolePermissionRepository: RolePermissionRepository,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async assign(roleId: string, permissionId: string): Promise<RolePermission> {
    await this.rolesService.findOne(roleId);
    await this.permissionsService.findOne(permissionId);
    if (await this.rolePermissionRepository.find(roleId, permissionId)) {
      throw new DuplicateRolePermissionError();
    }
    return this.rolePermissionRepository.save(
      RolePermission.create({ roleId, permissionId }),
    );
  }

  async listPermissions(roleId: string): Promise<Permission[]> {
    await this.rolesService.findOne(roleId);
    const grants = await this.rolePermissionRepository.findByRole(roleId);
    return this.permissionsService.findByIds(
      grants.map((grant) => grant.permissionId),
    );
  }

  async revoke(roleId: string, permissionId: string): Promise<void> {
    const deleted = await this.rolePermissionRepository.delete(
      roleId,
      permissionId,
    );
    if (!deleted) {
      throw new RolePermissionNotFoundError();
    }
  }
}
