import { Role } from '../../../../domain/entities/role.entity.js';
import { RoleOrmEntity } from '../entities/role.orm-entity.js';

export class RoleMapper {
  static toDomain(orm: RoleOrmEntity): Role {
    return Role.fromPersistence({
      id: orm.id,
      organizationId: orm.organizationId,
      code: orm.code,
      name: orm.name,
      description: orm.description,
      isSystem: orm.isSystem,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: Role, existing?: RoleOrmEntity): RoleOrmEntity {
    const orm = existing ?? new RoleOrmEntity();
    orm.id = domain.id;
    orm.organizationId = domain.organizationId;
    orm.code = domain.code;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.isSystem = domain.isSystem;
    orm.isActive = domain.isActive;
    return orm;
  }
}
