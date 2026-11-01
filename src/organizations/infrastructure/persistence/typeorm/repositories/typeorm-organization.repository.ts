import { Injectable } from '@nestjs/common';
import type {
  Page,
  PageRequest,
} from '../../../../../common/domain/pagination.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/infrastructure/persistence/typeorm-base.repository.js';
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

  async findPage(
    page: PageRequest,
    filter: { ids?: string[] } = {},
  ): Promise<Page<Organization>> {
    if (filter.ids && filter.ids.length === 0) {
      return { items: [], total: 0, page: page.page, limit: page.limit };
    }
    return this.findPageBy(
      {
        where: filter.ids ? { id: In(filter.ids) } : undefined,
        order: { name: 'ASC' },
      },
      page,
    );
  }

  async findByTaxIdentifier(
    taxIdentifier: string,
  ): Promise<Organization | null> {
    const found = await this.repository.findOne({ where: { taxIdentifier } });
    return found ? this.toDomain(found) : null;
  }
}
