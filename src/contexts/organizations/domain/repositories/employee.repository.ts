import { Employee } from '../entities/employee.entity.js';

export const EMPLOYEE_REPOSITORY = Symbol('EMPLOYEE_REPOSITORY');

export interface EmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  findAll(): Promise<Employee[]>;
  save(employee: Employee): Promise<Employee>;
  delete(id: string): Promise<boolean>;
}
