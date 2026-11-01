import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ScopeResolverRegistry } from '../../../common/infrastructure/http/access/scope-resolver.registry.js';
import { DINING_TABLE_REPOSITORY } from '../../domain/repositories/dining-table.repository.js';
import type { DiningTableRepository } from '../../domain/repositories/dining-table.repository.js';
import { EMPLOYEE_REPOSITORY } from '../../domain/repositories/employee.repository.js';
import type { EmployeeRepository } from '../../domain/repositories/employee.repository.js';
import { JOB_POSITION_REPOSITORY } from '../../domain/repositories/job-position.repository.js';
import type { JobPositionRepository } from '../../domain/repositories/job-position.repository.js';
import { RESTAURANT_FLOOR_REPOSITORY } from '../../domain/repositories/restaurant-floor.repository.js';
import type { RestaurantFloorRepository } from '../../domain/repositories/restaurant-floor.repository.js';
import { WORK_AREA_REPOSITORY } from '../../domain/repositories/work-area.repository.js';
import type { WorkAreaRepository } from '../../domain/repositories/work-area.repository.js';

/** Tells the authorization guard which tenant each organizations resource belongs to. */
@Injectable()
export class OrganizationsScopeResolvers implements OnModuleInit {
  constructor(
    private readonly registry: ScopeResolverRegistry,
    @Inject(RESTAURANT_FLOOR_REPOSITORY)
    private readonly floors: RestaurantFloorRepository,
    @Inject(DINING_TABLE_REPOSITORY)
    private readonly tables: DiningTableRepository,
    @Inject(EMPLOYEE_REPOSITORY) private readonly employees: EmployeeRepository,
    @Inject(WORK_AREA_REPOSITORY)
    private readonly workAreas: WorkAreaRepository,
    @Inject(JOB_POSITION_REPOSITORY)
    private readonly jobPositions: JobPositionRepository,
  ) {}

  onModuleInit(): void {
    this.registry.register('restaurant-floor', async (id) => {
      const floor = await this.floors.findById(id);
      return floor && { restaurantId: floor.restaurantId };
    });
    this.registry.register('dining-table', async (id) => {
      const table = await this.tables.findById(id);
      return table && { restaurantId: table.restaurantId };
    });
    this.registry.register('employee', async (id) => {
      const employee = await this.employees.findById(id);
      return employee && { organizationId: employee.organizationId };
    });
    this.registry.register('work-area', async (id) => {
      const workArea = await this.workAreas.findById(id);
      return workArea && { organizationId: workArea.organizationId };
    });
    this.registry.register('job-position', async (id) => {
      const jobPosition = await this.jobPositions.findById(id);
      return jobPosition && { organizationId: jobPosition.organizationId };
    });
  }
}
