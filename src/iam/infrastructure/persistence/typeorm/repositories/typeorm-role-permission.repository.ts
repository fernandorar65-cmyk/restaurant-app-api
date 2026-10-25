import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { RolePermission } from '../../../../domain/entities/role-permission.entity.js';
import { RolePermissionRepository } from '../../../../domain/repositories/role-permission.repository.js';
import { RolePermissionOrmEntity } from '../entities/role-permission.orm-entity.js';
import { RolePermissionMapper } from '../mappers/role-permission.mapper.js';

@Injectable()
export class TypeOrmRolePermissionRepository
  extends TypeOrmBaseRepository<RolePermission, RolePermissionOrmEntity>
  implements RolePermissionRepository
{
  constructor(
    @InjectRepository(RolePermissionOrmEntity)
    repository: Repository<RolePermissionOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: RolePermissionOrmEntity): RolePermission {
    return RolePermissionMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: RolePermission,
    existing?: RolePermissionOrmEntity,
  ): RolePermissionOrmEntity {
    return RolePermissionMapper.toPersistence(domain, existing);
  }

  async findByRoleAndPermission(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermission | null> {
    const found = await this.repository.findOne({
      where: { roleId, permissionId },
    });
    return found ? this.toDomain(found) : null;
  }
}
