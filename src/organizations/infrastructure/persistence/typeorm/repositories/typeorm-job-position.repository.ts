import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { JobPosition } from '../../../../domain/entities/job-position.entity.js';
import { JobPositionRepository } from '../../../../domain/repositories/job-position.repository.js';
import { JobPositionOrmEntity } from '../entities/job-position.orm-entity.js';
import { JobPositionMapper } from '../mappers/work-structure.mappers.js';

@Injectable()
export class TypeOrmJobPositionRepository
  extends TypeOrmBaseRepository<JobPosition, JobPositionOrmEntity>
  implements JobPositionRepository
{
  constructor(
    @InjectRepository(JobPositionOrmEntity)
    repository: Repository<JobPositionOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: JobPositionOrmEntity): JobPosition {
    return JobPositionMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: JobPosition,
    existing?: JobPositionOrmEntity,
  ): JobPositionOrmEntity {
    return JobPositionMapper.toPersistence(domain, existing);
  }

  findPage(
    filter: { organizationId?: string; workAreaId?: string; isActive?: boolean },
    page: PageRequest,
  ): Promise<Page<JobPosition>> {
    return this.findPageBy(
      {
        where: {
          organizationId: filter.organizationId,
          workAreaId: filter.workAreaId,
          isActive: filter.isActive,
        },
        order: { name: 'ASC' },
      },
      page,
    );
  }

  /** citext column: the comparison already ignores case. */
  async findByName(workAreaId: string, name: string): Promise<JobPosition | null> {
    const found = await this.repository.findOne({ where: { workAreaId, name } });
    return found ? this.toDomain(found) : null;
  }
}
