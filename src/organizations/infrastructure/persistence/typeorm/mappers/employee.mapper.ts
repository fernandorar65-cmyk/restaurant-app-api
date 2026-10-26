import { Employee } from '../../../../domain/entities/employee.entity.js';
import { EmployeeOrmEntity } from '../entities/employee.orm-entity.js';

export class EmployeeMapper {
  static toDomain(orm: EmployeeOrmEntity): Employee {
    return Employee.fromPersistence({
      id: orm.id,
      organizationId: orm.organizationId,
      userId: orm.userId,
      employeeCode: orm.employeeCode,
      documentNumber: orm.documentNumber,
      jobPositionId: orm.jobPositionId,
      status: orm.status,
      hiredAt: orm.hiredAt,
      terminatedAt: orm.terminatedAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: Employee,
    existing?: EmployeeOrmEntity,
  ): EmployeeOrmEntity {
    const orm = existing ?? new EmployeeOrmEntity();
    orm.id = domain.id;
    orm.organizationId = domain.organizationId;
    orm.userId = domain.userId;
    orm.employeeCode = domain.employeeCode;
    orm.documentNumber = domain.documentNumber;
    orm.jobPositionId = domain.jobPositionId;
    orm.status = domain.status;
    orm.hiredAt = domain.hiredAt;
    orm.terminatedAt = domain.terminatedAt;
    return orm;
  }
}
