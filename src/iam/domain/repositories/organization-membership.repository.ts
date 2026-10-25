import { OrganizationMembership } from '../entities/organization-membership.entity.js';

export const ORGANIZATION_MEMBERSHIP_REPOSITORY = Symbol(
  'ORGANIZATION_MEMBERSHIP_REPOSITORY',
);

export interface OrganizationMembershipRepository {
  findById(id: string): Promise<OrganizationMembership | null>;
  findByUser(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMembership | null>;
  findAll(filter?: {
    organizationId?: string;
    userId?: string;
  }): Promise<OrganizationMembership[]>;
  /** Persists the membership together with its restaurant scope. */
  save(membership: OrganizationMembership): Promise<OrganizationMembership>;
  delete(id: string): Promise<boolean>;
}
