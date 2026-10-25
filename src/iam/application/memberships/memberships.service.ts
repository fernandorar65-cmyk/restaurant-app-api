import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OrganizationMembership } from '../../domain/entities/organization-membership.entity.js';
import { MembershipStatus } from '../../domain/enums/membership-status.enum.js';
import {
  OrganizationReferenceNotFoundError,
  RestaurantReferenceNotFoundError,
} from '../../domain/exceptions/external-reference.errors.js';
import {
  DuplicateMembershipError,
  MembershipNotFoundError,
  RestaurantFromAnotherOrganizationError,
  RoleFromAnotherOrganizationError,
} from '../../domain/exceptions/membership.errors.js';
import { ORGANIZATION_MEMBERSHIP_REPOSITORY } from '../../domain/repositories/organization-membership.repository.js';
import type { OrganizationMembershipRepository } from '../../domain/repositories/organization-membership.repository.js';
import { ORGANIZATION_LOOKUP } from '../ports/organization-lookup.port.js';
import type { OrganizationLookupPort } from '../ports/organization-lookup.port.js';
import { RolesService } from '../roles/roles.service.js';
import { UsersService } from '../users/users.service.js';

export interface CreateMembershipInput {
  organizationId: string;
  userId: string;
  roleId: string;
  allRestaurants?: boolean;
  restaurantIds?: string[];
}

export interface UpdateMembershipInput {
  roleId?: string;
  allRestaurants?: boolean;
  restaurantIds?: string[];
  status?: MembershipStatus;
}

@Injectable()
export class MembershipsService {
  constructor(
    @Inject(ORGANIZATION_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: OrganizationMembershipRepository,
    @Inject(ORGANIZATION_LOOKUP)
    private readonly organizationLookup: OrganizationLookupPort,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
  ) {}

  async create(input: CreateMembershipInput): Promise<OrganizationMembership> {
    if (!(await this.organizationLookup.organizationExists(input.organizationId))) {
      throw new OrganizationReferenceNotFoundError(input.organizationId);
    }
    await this.usersService.findOne(input.userId);
    const existing = await this.membershipRepository.findByUser(
      input.organizationId,
      input.userId,
    );
    if (existing) {
      throw new DuplicateMembershipError();
    }
    const membership = OrganizationMembership.create({
      id: randomUUID(),
      ...input,
    });
    await this.assertConsistent(membership);
    return this.membershipRepository.save(membership);
  }

  findAll(
    filter: { organizationId?: string; userId?: string } = {},
  ): Promise<OrganizationMembership[]> {
    return this.membershipRepository.findAll(filter);
  }

  async findOne(id: string): Promise<OrganizationMembership> {
    const membership = await this.membershipRepository.findById(id);
    if (!membership) {
      throw new MembershipNotFoundError(id);
    }
    return membership;
  }

  async update(
    id: string,
    input: UpdateMembershipInput,
  ): Promise<OrganizationMembership> {
    const membership = await this.findOne(id);
    if (input.roleId !== undefined) {
      membership.changeRole(input.roleId);
    }
    if (input.allRestaurants !== undefined || input.restaurantIds !== undefined) {
      membership.changeScope(
        input.allRestaurants ?? membership.allRestaurants,
        input.restaurantIds ?? membership.restaurantIds,
      );
    }
    if (input.status !== undefined) {
      membership.changeStatus(input.status);
    }
    await this.assertConsistent(membership);
    return this.membershipRepository.save(membership);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.membershipRepository.delete(id);
    if (!deleted) {
      throw new MembershipNotFoundError(id);
    }
  }

  /** Role and restaurants must belong to the membership's organization. */
  private async assertConsistent(
    membership: OrganizationMembership,
  ): Promise<void> {
    const role = await this.rolesService.findOne(membership.roleId);
    if (role.organizationId !== membership.organizationId) {
      throw new RoleFromAnotherOrganizationError();
    }
    for (const restaurantId of membership.restaurantIds) {
      const organizationId =
        await this.organizationLookup.findRestaurantOrganizationId(restaurantId);
      if (!organizationId) {
        throw new RestaurantReferenceNotFoundError(restaurantId);
      }
      if (organizationId !== membership.organizationId) {
        throw new RestaurantFromAnotherOrganizationError(restaurantId);
      }
    }
  }
}
