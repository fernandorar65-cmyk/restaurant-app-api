import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../../domain/entities/role.entity.js';
import { RoleRepository } from '../../../../domain/repositories/role.repository.js';
import { RoleOrmEntity } from '../entities/role.orm-entity.js';
import { RoleMapper } from '../mappers/role.mapper.js';

@Injectable()
export class TypeOrmRoleRepository implements RoleRepository {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly repository: Repository<RoleOrmEntity>,
  ) {}

  async findById(id: string): Promise<Role | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? RoleMapper.toDomain(found) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const found = await this.repository.findOne({ where: { name } });
    return found ? RoleMapper.toDomain(found) : null;
  }

  async findAll(): Promise<Role[]> {
    const rows = await this.repository.find();
    return rows.map(RoleMapper.toDomain);
  }

  async save(role: Role): Promise<Role> {
    const existing = await this.repository.findOne({ where: { id: role.id } });
    const orm = RoleMapper.toPersistence(role, existing ?? undefined);
    const saved = await this.repository.save(orm);
    return RoleMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
