import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { WorkArea } from '../../domain/entities/work-area.entity.js';
import {
  DuplicateWorkAreaNameError,
  WorkAreaNotFoundError,
} from '../../domain/exceptions/work-structure.errors.js';
import { WORK_AREA_REPOSITORY } from '../../domain/repositories/work-area.repository.js';
import type { WorkAreaRepository } from '../../domain/repositories/work-area.repository.js';
import { OrganizationsService } from '../organizations/organizations.service.js';

@Injectable()
export class WorkAreasService {
  constructor(
    @Inject(WORK_AREA_REPOSITORY)
    private readonly workAreaRepository: WorkAreaRepository,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async create(input: {
    organizationId: string;
    name: string;
    description?: string | null;
  }): Promise<WorkArea> {
    await this.organizationsService.findOne(input.organizationId);
    const workArea = WorkArea.create({ id: randomUUID(), ...input });
    await this.assertNameIsFree(workArea);
    return this.workAreaRepository.save(workArea);
  }

  findPage(
    filter: { organizationId?: string; isActive?: boolean },
    page: PageRequest,
  ): Promise<Page<WorkArea>> {
    return this.workAreaRepository.findPage(filter, page);
  }

  async findOne(id: string): Promise<WorkArea> {
    const workArea = await this.workAreaRepository.findById(id);
    if (!workArea) {
      throw new WorkAreaNotFoundError(id);
    }
    return workArea;
  }

  /** Also activates / deactivates through isActive. */
  async update(
    id: string,
    input: { name?: string; description?: string | null; isActive?: boolean },
  ): Promise<WorkArea> {
    const workArea = await this.findOne(id);
    workArea.update(input);
    await this.assertNameIsFree(workArea);
    return this.workAreaRepository.save(workArea);
  }

  /** Never deleted: positions and employees may still reference it. */
  async deactivate(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  private async assertNameIsFree(workArea: WorkArea): Promise<void> {
    const existing = await this.workAreaRepository.findByName(
      workArea.organizationId,
      workArea.name,
    );
    if (existing && existing.id !== workArea.id) {
      throw new DuplicateWorkAreaNameError(workArea.name);
    }
  }
}
