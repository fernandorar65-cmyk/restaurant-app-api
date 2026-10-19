import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionsService } from '../permissions/permissions.service.js';
import { RolesService } from '../roles/roles.service.js';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto.js';
import { RolePermission } from './entities/role-permission.entity.js';

@Injectable()
export class RolePermissionsService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepository: Repository<RolePermission>,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(dto: CreateRolePermissionDto): Promise<RolePermission> {
    await this.rolesService.findOne(dto.roleId);
    await this.permissionsService.findOne(dto.permissionId);

    const existing = await this.rolePermissionsRepository.findOne({
      where: { roleId: dto.roleId, permissionId: dto.permissionId },
    });
    if (existing) {
      throw new ConflictException(
        'This role already has the given permission assigned',
      );
    }

    const rolePermission = this.rolePermissionsRepository.create(dto);
    return this.rolePermissionsRepository.save(rolePermission);
  }

  findAll(): Promise<RolePermission[]> {
    return this.rolePermissionsRepository.find({
      relations: { role: true, permission: true },
    });
  }

  async findOne(id: string): Promise<RolePermission> {
    const rolePermission = await this.rolePermissionsRepository.findOne({
      where: { id },
      relations: { role: true, permission: true },
    });
    if (!rolePermission) {
      throw new NotFoundException(`Role-permission with id "${id}" not found`);
    }
    return rolePermission;
  }

  async remove(id: string): Promise<void> {
    const result = await this.rolePermissionsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Role-permission with id "${id}" not found`);
    }
  }
}
