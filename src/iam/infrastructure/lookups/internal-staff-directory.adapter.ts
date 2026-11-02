import { Injectable } from '@nestjs/common';
import {
  EmployeesService,
  OrganizationsService,
} from '../../../organizations/public-api.js';
import type {
  StaffDirectoryPort,
  StaffEmployment,
} from '../../application/ports/staff-directory.port.js';

/** In-process adapter over the organizations context's employees. */
@Injectable()
export class InternalStaffDirectoryAdapter implements StaffDirectoryPort {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async findEmployments(userId: string): Promise<StaffEmployment[]> {
    const employments =
      await this.employeesService.findEmploymentsOfUser(userId);
    return employments.map(
      ({ employee, organizationName, jobPosition, workArea }) => ({
        employeeId: employee.id,
        organizationId: employee.organizationId,
        organizationName,
        employeeCode: employee.employeeCode,
        status: employee.status,
        hiredAt: employee.hiredAt,
        jobPosition,
        workArea,
      }),
    );
  }

  async organizationNames(ids: string[]): Promise<Map<string, string>> {
    const organizations = await Promise.all(
      ids.map((id) => this.organizationsService.findOne(id)),
    );
    return new Map(
      organizations.map((organization) => [organization.id, organization.name]),
    );
  }
}
