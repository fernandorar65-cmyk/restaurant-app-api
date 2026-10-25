import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from '../../../../domain/entities/role-permission.entity.js';
import { RolePermissionRepository } from '../../../../domain/repositories/role-permission.repository.js';
import { RolePermissionOrmEntity } from '../entities/role-permission.orm-entity.js';
import { RolePermissionMapper } from '../mappers/role-permission.mapper.js';

@Injectable()
export class TypeOrmRolePermissionRepository implements RolePermissionRepository {
  constructor(
    @InjectRepository(RolePermissionOrmEntity)
    private readonly repository: Repository<RolePermissionOrmEntity>,
  ) {}

  async findById(id: string): Promise<RolePermission | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? RolePermissionMapper.toDomain(found) : null;
  }

  async findByRoleAndPermission(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermission | null> {
    const found = await this.repository.findOne({
      where: { roleId, permissionId },
    });
    return found ? RolePermissionMapper.toDomain(found) : null;
  }

  async findAll(): Promise<RolePermission[]> {
    const rows = await this.repository.find();
    return rows.map(RolePermissionMapper.toDomain);
  }

  async save(rolePermission: RolePermission): Promise<RolePermission> {
    const existing = await this.repository.findOne({
      where: { id: rolePermission.id },
    });
    const orm = RolePermissionMapper.toPersistence(
      rolePermission,
      existing ?? undefined,
    );
    const saved = await this.repository.save(orm);
    return RolePermissionMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
