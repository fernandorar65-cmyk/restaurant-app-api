import { Employee } from '../../../../domain/entities/employee.entity.js';
import { EmployeeOrmEntity } from '../entities/employee.orm-entity.js';

export class EmployeeMapper {
  static toDomain(orm: EmployeeOrmEntity): Employee {
    return Employee.fromPersistence({
      id: orm.id,
      name: orm.name,
      email: orm.email ?? null,
      position: orm.position,
      restaurantId: orm.restaurantId,
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
    orm.name = domain.name;
    orm.email = domain.email ?? undefined;
    orm.position = domain.position;
    orm.restaurantId = domain.restaurantId;
    return orm;
  }
}
