import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Permission } from '../../../../domain/entities/permission.entity.js';
import { PermissionRepository } from '../../../../domain/repositories/permission.repository.js';
import { PermissionOrmEntity } from '../entities/permission.orm-entity.js';
import { PermissionMapper } from '../mappers/permission.mapper.js';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';

@Injectable()
export class TypeOrmPermissionRepository
  extends TypeOrmBaseRepository<Permission, PermissionOrmEntity>
  implements PermissionRepository
{
  constructor(
    @InjectRepository(PermissionOrmEntity)
    repository: Repository<PermissionOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: PermissionOrmEntity): Permission {
    return PermissionMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: Permission,
    existing?: PermissionOrmEntity,
  ): PermissionOrmEntity {
    return PermissionMapper.toPersistence(domain, existing);
  }

  async findPage(page: PageRequest): Promise<Page<Permission>> {
    return this.findPageBy({ order: { code: 'ASC' } }, page);
  }

  async findByCode(code: string): Promise<Permission | null> {
    const found = await this.repository.findOne({ where: { code } });
    return found ? this.toDomain(found) : null;
  }

  async findActive(): Promise<Permission[]> {
    const rows = await this.repository.find({
      where: { isActive: true },
      order: { code: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.repository.find({
      where: { id: In(ids) },
      order: { code: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }
}
