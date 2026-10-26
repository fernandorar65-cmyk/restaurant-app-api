import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Role } from '../../../../domain/entities/role.entity.js';
import { RoleRepository } from '../../../../domain/repositories/role.repository.js';
import { RoleOrmEntity } from '../entities/role.orm-entity.js';
import { RoleMapper } from '../mappers/role.mapper.js';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';

@Injectable()
export class TypeOrmRoleRepository
  extends TypeOrmBaseRepository<Role, RoleOrmEntity>
  implements RoleRepository
{
  constructor(
    @InjectRepository(RoleOrmEntity)
    repository: Repository<RoleOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: RoleOrmEntity): Role {
    return RoleMapper.toDomain(orm);
  }

  protected toPersistence(domain: Role, existing?: RoleOrmEntity): RoleOrmEntity {
    return RoleMapper.toPersistence(domain, existing);
  }

  async findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<Role>> {
    return this.findPageBy({
      where: { organizationId: filter.organizationId },
      order: { code: 'ASC' },
    }, page);
  }

  async findByCode(organizationId: string, code: string): Promise<Role | null> {
    const found = await this.repository.findOne({
      where: { organizationId, code },
    });
    return found ? this.toDomain(found) : null;
  }
}
