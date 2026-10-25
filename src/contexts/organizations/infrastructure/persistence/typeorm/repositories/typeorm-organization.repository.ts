import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../../../domain/entities/organization.entity.js';
import { OrganizationRepository } from '../../../../domain/repositories/organization.repository.js';
import { OrganizationOrmEntity } from '../entities/organization.orm-entity.js';
import { OrganizationMapper } from '../mappers/organization.mapper.js';

@Injectable()
export class TypeOrmOrganizationRepository implements OrganizationRepository {
  constructor(
    @InjectRepository(OrganizationOrmEntity)
    private readonly repository: Repository<OrganizationOrmEntity>,
  ) {}

  async findById(id: string): Promise<Organization | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? OrganizationMapper.toDomain(found) : null;
  }

  async findByName(name: string): Promise<Organization | null> {
    const found = await this.repository.findOne({ where: { name } });
    return found ? OrganizationMapper.toDomain(found) : null;
  }

  async findAll(): Promise<Organization[]> {
    const rows = await this.repository.find();
    return rows.map(OrganizationMapper.toDomain);
  }

  async save(organization: Organization): Promise<Organization> {
    const existing = await this.repository.findOne({
      where: { id: organization.id },
    });
    const orm = OrganizationMapper.toPersistence(
      organization,
      existing ?? undefined,
    );
    const saved = await this.repository.save(orm);
    return OrganizationMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
