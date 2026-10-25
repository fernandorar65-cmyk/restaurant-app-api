export const ORGANIZATION_LOOKUP = Symbol('IAM_ORGANIZATION_LOOKUP');

/**
 * IAM's own view of organizations and restaurants, limited to what it needs
 * to validate roles and memberships. Backed today by an in-process adapter
 * that calls the organizations context.
 */
export interface OrganizationLookupPort {
  organizationExists(organizationId: string): Promise<boolean>;
  /** Organization that owns the restaurant, or null if it does not exist. */
  findRestaurantOrganizationId(restaurantId: string): Promise<string | null>;
}
