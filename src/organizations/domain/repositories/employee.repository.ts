import { Employee } from '../entities/employee.entity.js';

export const EMPLOYEE_REPOSITORY = Symbol('EMPLOYEE_REPOSITORY');

export interface EmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  findByCode(organizationId: string, code: string): Promise<Employee | null>;
  findByUser(organizationId: string, userId: string): Promise<Employee | null>;
  findAll(filter?: { organizationId?: string }): Promise<Employee[]>;
  save(employee: Employee): Promise<Employee>;
  delete(id: string): Promise<boolean>;
}
