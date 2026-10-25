import { OrganizationMembership } from '../../../../domain/entities/organization-membership.entity.js';
import { OrganizationMembershipOrmEntity } from '../entities/organization-membership.orm-entity.js';

export class OrganizationMembershipMapper {
  static toDomain(
    orm: OrganizationMembershipOrmEntity,
    restaurantIds: string[],
  ): OrganizationMembership {
    return OrganizationMembership.fromPersistence({
      id: orm.id,
      organizationId: orm.organizationId,
      userId: orm.userId,
      roleId: orm.roleId,
      allRestaurants: orm.allRestaurants,
      restaurantIds,
      status: orm.status,
      joinedAt: orm.joinedAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: OrganizationMembership,
    existing?: OrganizationMembershipOrmEntity,
  ): OrganizationMembershipOrmEntity {
    const orm = existing ?? new OrganizationMembershipOrmEntity();
    orm.id = domain.id;
    orm.organizationId = domain.organizationId;
    orm.userId = domain.userId;
    orm.roleId = domain.roleId;
    orm.allRestaurants = domain.allRestaurants;
    orm.status = domain.status;
    orm.joinedAt = domain.joinedAt;
    return orm;
  }
}
