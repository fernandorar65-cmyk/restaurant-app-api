import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Employee } from '../../domain/entities/employee.entity.js';
import { EmployeeNotFoundError } from '../../domain/exceptions/employee.errors.js';
import { EMPLOYEE_REPOSITORY } from '../../domain/repositories/employee.repository.js';
import type { EmployeeRepository } from '../../domain/repositories/employee.repository.js';
import { RestaurantsService } from '../restaurants/restaurants.service.js';

export interface CreateEmployeeInput {
  name: string;
  email?: string;
  position: string;
  restaurantId: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  position?: string;
  restaurantId?: string;
}

@Injectable()
export class EmployeesService {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepository,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async create(input: CreateEmployeeInput): Promise<Employee> {
    await this.restaurantsService.findOne(input.restaurantId);
    const employee = Employee.create({ id: randomUUID(), ...input });
    return this.employeeRepository.save(employee);
  }

  findAll(): Promise<Employee[]> {
    return this.employeeRepository.findAll();
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
    if (input.restaurantId) {
      await this.restaurantsService.findOne(input.restaurantId);
    }
    employee.update(input);
    return this.employeeRepository.save(employee);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.employeeRepository.delete(id);
    if (!deleted) {
      throw new EmployeeNotFoundError(id);
    }
  }
}
