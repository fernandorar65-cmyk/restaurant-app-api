import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ScopeResolverRegistry } from '../../../common/infrastructure/http/access/scope-resolver.registry.js';
import { ORGANIZATION_MEMBERSHIP_REPOSITORY } from '../../domain/repositories/organization-membership.repository.js';
import type { OrganizationMembershipRepository } from '../../domain/repositories/organization-membership.repository.js';
import { ROLE_REPOSITORY } from '../../domain/repositories/role.repository.js';
import type { RoleRepository } from '../../domain/repositories/role.repository.js';

/** Tells the authorization guard which organization each IAM resource belongs to. */
@Injectable()
export class IamScopeResolvers implements OnModuleInit {
  constructor(
    private readonly registry: ScopeResolverRegistry,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(ORGANIZATION_MEMBERSHIP_REPOSITORY)
    private readonly memberships: OrganizationMembershipRepository,
  ) {}

  onModuleInit(): void {
    this.registry.register('role', async (id) => {
      const role = await this.roles.findById(id);
      return role && { organizationId: role.organizationId };
    });
    this.registry.register('membership', async (id) => {
      const membership = await this.memberships.findById(id);
      return membership && { organizationId: membership.organizationId };
    });
  }
}
