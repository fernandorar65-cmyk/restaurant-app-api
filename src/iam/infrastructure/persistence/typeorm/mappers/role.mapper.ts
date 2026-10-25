import { Role } from '../../../../domain/entities/role.entity.js';
import { RoleOrmEntity } from '../entities/role.orm-entity.js';

export class RoleMapper {
  static toDomain(orm: RoleOrmEntity): Role {
    return Role.fromPersistence({
      id: orm.id,
      name: orm.name,
      description: orm.description ?? null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: Role, existing?: RoleOrmEntity): RoleOrmEntity {
    const orm = existing ?? new RoleOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.description = domain.description;
    return orm;
  }
}
