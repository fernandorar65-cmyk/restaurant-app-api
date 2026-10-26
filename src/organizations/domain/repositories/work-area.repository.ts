import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { WorkArea } from '../entities/work-area.entity.js';

export const WORK_AREA_REPOSITORY = Symbol('WORK_AREA_REPOSITORY');

export interface WorkAreaRepository {
  findById(id: string): Promise<WorkArea | null>;
  /** Case-insensitive. */
  findByName(organizationId: string, name: string): Promise<WorkArea | null>;
  findPage(
    filter: { organizationId?: string; isActive?: boolean },
    page: PageRequest,
  ): Promise<Page<WorkArea>>;
  save(workArea: WorkArea): Promise<WorkArea>;
}
