import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Employee } from '../../../../domain/entities/employee.entity.js';
import { EmployeeRepository } from '../../../../domain/repositories/employee.repository.js';
import { EmployeeOrmEntity } from '../entities/employee.orm-entity.js';
import { EmployeeMapper } from '../mappers/employee.mapper.js';

@Injectable()
export class TypeOrmEmployeeRepository
  extends TypeOrmBaseRepository<Employee, EmployeeOrmEntity>
  implements EmployeeRepository
{
  constructor(
    @InjectRepository(EmployeeOrmEntity)
    repository: Repository<EmployeeOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: EmployeeOrmEntity): Employee {
    return EmployeeMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: Employee,
    existing?: EmployeeOrmEntity,
  ): EmployeeOrmEntity {
    return EmployeeMapper.toPersistence(domain, existing);
  }
}
