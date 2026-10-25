import { Organization } from '../../../../domain/entities/organization.entity.js';
import { OrganizationOrmEntity } from '../entities/organization.orm-entity.js';

export class OrganizationMapper {
  static toDomain(orm: OrganizationOrmEntity): Organization {
    return Organization.fromPersistence({
      id: orm.id,
      name: orm.name,
      legalName: orm.legalName,
      taxIdentifier: orm.taxIdentifier,
      currencyCode: orm.currencyCode,
      timezone: orm.timezone,
      status: orm.status,
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
    orm.legalName = domain.legalName;
    orm.taxIdentifier = domain.taxIdentifier;
    orm.currencyCode = domain.currencyCode;
    orm.timezone = domain.timezone;
    orm.status = domain.status;
    return orm;
  }
}
