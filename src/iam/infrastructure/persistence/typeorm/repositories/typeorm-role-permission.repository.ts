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

  async find(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermission | null> {
    const found = await this.repository.findOne({
      where: { roleId, permissionId },
    });
    return found ? RolePermissionMapper.toDomain(found) : null;
  }

  async findByRole(roleId: string): Promise<RolePermission[]> {
    const rows = await this.repository.find({ where: { roleId } });
    return rows.map((row) => RolePermissionMapper.toDomain(row));
  }

  async save(rolePermission: RolePermission): Promise<RolePermission> {
    const saved = await this.repository.save(
      RolePermissionMapper.toPersistence(rolePermission),
    );
    return RolePermissionMapper.toDomain(saved);
  }

  async delete(roleId: string, permissionId: string): Promise<boolean> {
    const result = await this.repository.delete({ roleId, permissionId });
    return (result.affected ?? 0) > 0;
  }
}
