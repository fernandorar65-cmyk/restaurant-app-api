import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../../../domain/entities/permission.entity.js';
import { PermissionRepository } from '../../../../domain/repositories/permission.repository.js';
import { PermissionOrmEntity } from '../entities/permission.orm-entity.js';
import { PermissionMapper } from '../mappers/permission.mapper.js';

@Injectable()
export class TypeOrmPermissionRepository implements PermissionRepository {
  constructor(
    @InjectRepository(PermissionOrmEntity)
    private readonly repository: Repository<PermissionOrmEntity>,
  ) {}

  async findById(id: string): Promise<Permission | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? PermissionMapper.toDomain(found) : null;
  }

  async findByName(name: string): Promise<Permission | null> {
    const found = await this.repository.findOne({ where: { name } });
    return found ? PermissionMapper.toDomain(found) : null;
  }

  async findAll(): Promise<Permission[]> {
    const rows = await this.repository.find();
    return rows.map(PermissionMapper.toDomain);
  }

  async save(permission: Permission): Promise<Permission> {
    const existing = await this.repository.findOne({
      where: { id: permission.id },
    });
    const orm = PermissionMapper.toPersistence(permission, existing ?? undefined);
    const saved = await this.repository.save(orm);
    return PermissionMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
