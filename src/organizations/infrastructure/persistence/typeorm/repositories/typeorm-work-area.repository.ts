import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { WorkArea } from '../../../../domain/entities/work-area.entity.js';
import { WorkAreaRepository } from '../../../../domain/repositories/work-area.repository.js';
import { WorkAreaOrmEntity } from '../entities/work-area.orm-entity.js';
import { WorkAreaMapper } from '../mappers/work-structure.mappers.js';

@Injectable()
export class TypeOrmWorkAreaRepository
  extends TypeOrmBaseRepository<WorkArea, WorkAreaOrmEntity>
  implements WorkAreaRepository
{
  constructor(
    @InjectRepository(WorkAreaOrmEntity)
    repository: Repository<WorkAreaOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: WorkAreaOrmEntity): WorkArea {
    return WorkAreaMapper.toDomain(orm);
  }

  protected toPersistence(domain: WorkArea, existing?: WorkAreaOrmEntity): WorkAreaOrmEntity {
    return WorkAreaMapper.toPersistence(domain, existing);
  }

  findPage(
    filter: { organizationId?: string; isActive?: boolean },
    page: PageRequest,
  ): Promise<Page<WorkArea>> {
    return this.findPageBy(
      {
        where: { organizationId: filter.organizationId, isActive: filter.isActive },
        order: { name: 'ASC' },
      },
      page,
    );
  }

  /** citext column: the comparison already ignores case. */
  async findByName(organizationId: string, name: string): Promise<WorkArea | null> {
    const found = await this.repository.findOne({ where: { organizationId, name } });
    return found ? this.toDomain(found) : null;
  }
}
