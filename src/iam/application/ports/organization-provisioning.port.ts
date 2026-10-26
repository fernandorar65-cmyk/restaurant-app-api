import type { TransactionContext } from '../../../common/domain/transaction-context.js';

export const ORGANIZATION_PROVISIONING = Symbol('IAM_ORGANIZATION_PROVISIONING');

export interface NewOrganization {
  name: string;
  legalName?: string | null;
  taxIdentifier?: string | null;
  currencyCode?: string;
  timezone?: string;
}

export interface NewRestaurant {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * Lets IAM create the organization (and its first restaurant) as part of
 * its own transaction when an owner signs up.
 */
export interface OrganizationProvisioningPort {
  createOrganization(
    input: NewOrganization,
    tx: TransactionContext,
  ): Promise<{ id: string; name: string }>;
  createRestaurant(
    organizationId: string,
    input: NewRestaurant,
    tx: TransactionContext,
  ): Promise<{ id: string; name: string; slug: string }>;
}
