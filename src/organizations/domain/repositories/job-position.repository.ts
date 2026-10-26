import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { JobPosition } from '../entities/job-position.entity.js';

export const JOB_POSITION_REPOSITORY = Symbol('JOB_POSITION_REPOSITORY');

export interface JobPositionRepository {
  findById(id: string): Promise<JobPosition | null>;
  /** Case-insensitive, within one work area. */
  findByName(workAreaId: string, name: string): Promise<JobPosition | null>;
  findPage(
    filter: { organizationId?: string; workAreaId?: string; isActive?: boolean },
    page: PageRequest,
  ): Promise<Page<JobPosition>>;
  save(jobPosition: JobPosition): Promise<JobPosition>;
}
