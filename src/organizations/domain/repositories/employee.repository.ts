import { Employee } from '../entities/employee.entity.js';
import type { Page, PageRequest } from '../../../common/domain/pagination.js';

export const EMPLOYEE_REPOSITORY = Symbol('EMPLOYEE_REPOSITORY');

export interface EmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  findByCode(organizationId: string, code: string): Promise<Employee | null>;
  findByUser(organizationId: string, userId: string): Promise<Employee | null>;
  /** The user's employee records in every organization. */
  findAllByUser(userId: string): Promise<Employee[]>;
  findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<Employee>>;
  save(employee: Employee): Promise<Employee>;
  delete(id: string): Promise<boolean>;
}
