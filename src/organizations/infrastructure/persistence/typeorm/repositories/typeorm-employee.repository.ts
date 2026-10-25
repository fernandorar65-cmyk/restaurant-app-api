import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../../../domain/entities/employee.entity.js';
import { EmployeeRepository } from '../../../../domain/repositories/employee.repository.js';
import { EmployeeOrmEntity } from '../entities/employee.orm-entity.js';
import { EmployeeMapper } from '../mappers/employee.mapper.js';

@Injectable()
export class TypeOrmEmployeeRepository implements EmployeeRepository {
  constructor(
    @InjectRepository(EmployeeOrmEntity)
    private readonly repository: Repository<EmployeeOrmEntity>,
  ) {}

  async findById(id: string): Promise<Employee | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? EmployeeMapper.toDomain(found) : null;
  }

  async findAll(): Promise<Employee[]> {
    const rows = await this.repository.find();
    return rows.map(EmployeeMapper.toDomain);
  }

  async save(employee: Employee): Promise<Employee> {
    const existing = await this.repository.findOne({
      where: { id: employee.id },
    });
    const orm = EmployeeMapper.toPersistence(employee, existing ?? undefined);
    const saved = await this.repository.save(orm);
    return EmployeeMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
