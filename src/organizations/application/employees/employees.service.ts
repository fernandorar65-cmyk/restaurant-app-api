import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Employee } from '../../domain/entities/employee.entity.js';
import type { EmployeeDetails } from '../../domain/entities/employee.entity.js';
import { EmployeeStatus } from '../../domain/enums/employee-status.enum.js';
import {
  DuplicateEmployeeCodeError,
  EmployeeNotFoundError,
  UserAlreadyEmployeeError,
  UserReferenceNotFoundError,
} from '../../domain/exceptions/employee.errors.js';
import {
  InactiveJobPositionError,
  JobPositionFromAnotherOrganizationError,
} from '../../domain/exceptions/work-structure.errors.js';
import { EMPLOYEE_REPOSITORY } from '../../domain/repositories/employee.repository.js';
import type { EmployeeRepository } from '../../domain/repositories/employee.repository.js';
import { JobPositionsService } from '../job-positions/job-positions.service.js';
import { OrganizationsService } from '../organizations/organizations.service.js';
import { USER_LOOKUP } from '../ports/user-lookup.port.js';
import type { UserLookupPort } from '../ports/user-lookup.port.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export interface CreateEmployeeInput extends EmployeeDetails {
  organizationId: string;
  userId?: string | null;
  employeeCode: string;
}

export interface UpdateEmployeeInput extends EmployeeDetails {
  userId?: string | null;
  status?: EmployeeStatus;
}

@Injectable()
export class EmployeesService {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepository,
    @Inject(USER_LOOKUP) private readonly userLookup: UserLookupPort,
    private readonly organizationsService: OrganizationsService,
    private readonly jobPositionsService: JobPositionsService,
  ) {}

  async create(input: CreateEmployeeInput): Promise<Employee> {
    await this.organizationsService.findOne(input.organizationId);
    const employee = Employee.create({ id: randomUUID(), ...input });
    await this.assertAssignablePosition(employee.organizationId, employee.jobPositionId);
    await this.assertConsistent(employee);
    return this.employeeRepository.save(employee);
  }

  findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<Employee>> {
    return this.employeeRepository.findPage(filter, page);
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new EmployeeNotFoundError(id);
    }
    return employee;
  }

  async update(id: string, input: UpdateEmployeeInput): Promise<Employee> {
    const employee = await this.findOne(id);
    // Only a newly assigned position is checked: keeping a position that was
    // deactivated later is fine.
    if (
      input.jobPositionId !== undefined &&
      input.jobPositionId !== employee.jobPositionId
    ) {
      await this.assertAssignablePosition(employee.organizationId, input.jobPositionId);
    }
    employee.update(input);
    await this.assertConsistent(employee);
    return this.employeeRepository.save(employee);
  }

  /**
   * Logical delete: operational history must be kept, so the record is
   * deactivated instead of removed.
   */
  async deactivate(id: string): Promise<void> {
    const employee = await this.findOne(id);
    employee.update({ status: EmployeeStatus.INACTIVE });
    await this.employeeRepository.save(employee);
  }

  private async assertAssignablePosition(
    organizationId: string,
    jobPositionId: string | null | undefined,
  ): Promise<void> {
    if (!jobPositionId) {
      return;
    }
    const jobPosition = await this.jobPositionsService.findOne(jobPositionId);
    if (jobPosition.organizationId !== organizationId) {
      throw new JobPositionFromAnotherOrganizationError();
    }
    if (!jobPosition.isActive) {
      throw new InactiveJobPositionError();
    }
  }

  private async assertConsistent(employee: Employee): Promise<void> {
    const sameCode = await this.employeeRepository.findByCode(
      employee.organizationId,
      employee.employeeCode,
    );
    if (sameCode && sameCode.id !== employee.id) {
      throw new DuplicateEmployeeCodeError(employee.employeeCode);
    }
    if (!employee.userId) {
      return;
    }
    if (!(await this.userLookup.exists(employee.userId))) {
      throw new UserReferenceNotFoundError(employee.userId);
    }
    const sameUser = await this.employeeRepository.findByUser(
      employee.organizationId,
      employee.userId,
    );
    if (sameUser && sameUser.id !== employee.id) {
      throw new UserAlreadyEmployeeError();
    }
  }
}
