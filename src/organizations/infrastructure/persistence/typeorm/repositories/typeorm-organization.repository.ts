import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Organization } from '../../../../domain/entities/organization.entity.js';
import { OrganizationRepository } from '../../../../domain/repositories/organization.repository.js';
import { OrganizationOrmEntity } from '../entities/organization.orm-entity.js';
import { OrganizationMapper } from '../mappers/organization.mapper.js';

@Injectable()
export class TypeOrmOrganizationRepository
  extends TypeOrmBaseRepository<Organization, OrganizationOrmEntity>
  implements OrganizationRepository
{
  constructor(
    @InjectRepository(OrganizationOrmEntity)
    repository: Repository<OrganizationOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: OrganizationOrmEntity): Organization {
    return OrganizationMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: Organization,
    existing?: OrganizationOrmEntity,
  ): OrganizationOrmEntity {
    return OrganizationMapper.toPersistence(domain, existing);
  }

  async findByName(name: string): Promise<Organization | null> {
    const found = await this.repository.findOne({ where: { name } });
    return found ? this.toDomain(found) : null;
  }
}
