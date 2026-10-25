import { Organization } from '../../../../domain/entities/organization.entity.js';
import { OrganizationOrmEntity } from '../entities/organization.orm-entity.js';

export class OrganizationMapper {
  static toDomain(orm: OrganizationOrmEntity): Organization {
    return Organization.fromPersistence({
      id: orm.id,
      name: orm.name,
      email: orm.email ?? null,
      phone: orm.phone ?? null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: Organization,
    existing?: OrganizationOrmEntity,
  ): OrganizationOrmEntity {
    const orm = existing ?? new OrganizationOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.email = domain.email ?? undefined;
    orm.phone = domain.phone ?? undefined;
    return orm;
  }
}
