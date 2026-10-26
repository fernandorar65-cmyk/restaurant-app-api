import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { JobPosition } from '../../domain/entities/job-position.entity.js';
import {
  DuplicateJobPositionNameError,
  InactiveWorkAreaError,
  JobPositionNotFoundError,
  WorkAreaFromAnotherOrganizationError,
} from '../../domain/exceptions/work-structure.errors.js';
import { JOB_POSITION_REPOSITORY } from '../../domain/repositories/job-position.repository.js';
import type { JobPositionRepository } from '../../domain/repositories/job-position.repository.js';
import { WorkAreasService } from '../work-areas/work-areas.service.js';

@Injectable()
export class JobPositionsService {
  constructor(
    @Inject(JOB_POSITION_REPOSITORY)
    private readonly jobPositionRepository: JobPositionRepository,
    private readonly workAreasService: WorkAreasService,
  ) {}

  /** The organization is taken from the work area, so they can never disagree. */
  async create(input: {
    workAreaId: string;
    name: string;
    description?: string | null;
  }): Promise<JobPosition> {
    const workArea = await this.workAreasService.findOne(input.workAreaId);
    if (!workArea.isActive) {
      throw new InactiveWorkAreaError();
    }
    const jobPosition = JobPosition.create({
      id: randomUUID(),
      organizationId: workArea.organizationId,
      ...input,
    });
    await this.assertNameIsFree(jobPosition);
    return this.jobPositionRepository.save(jobPosition);
  }

  findPage(
    filter: { organizationId?: string; workAreaId?: string; isActive?: boolean },
    page: PageRequest,
  ): Promise<Page<JobPosition>> {
    return this.jobPositionRepository.findPage(filter, page);
  }

  async findOne(id: string): Promise<JobPosition> {
    const jobPosition = await this.jobPositionRepository.findById(id);
    if (!jobPosition) {
      throw new JobPositionNotFoundError(id);
    }
    return jobPosition;
  }

  /** Also activates / deactivates through isActive; can move to another area. */
  async update(
    id: string,
    input: {
      workAreaId?: string;
      name?: string;
      description?: string | null;
      isActive?: boolean;
    },
  ): Promise<JobPosition> {
    const jobPosition = await this.findOne(id);
    if (input.workAreaId && input.workAreaId !== jobPosition.workAreaId) {
      const workArea = await this.workAreasService.findOne(input.workAreaId);
      if (workArea.organizationId !== jobPosition.organizationId) {
        throw new WorkAreaFromAnotherOrganizationError();
      }
      if (!workArea.isActive) {
        throw new InactiveWorkAreaError();
      }
    }
    jobPosition.update(input);
    await this.assertNameIsFree(jobPosition);
    return this.jobPositionRepository.save(jobPosition);
  }

  /**
   * Never deleted: employees that already hold it keep it unchanged; it just
   * can't be assigned anymore.
   */
  async deactivate(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  private async assertNameIsFree(jobPosition: JobPosition): Promise<void> {
    const existing = await this.jobPositionRepository.findByName(
      jobPosition.workAreaId,
      jobPosition.name,
    );
    if (existing && existing.id !== jobPosition.id) {
      throw new DuplicateJobPositionNameError(jobPosition.name);
    }
  }
}
