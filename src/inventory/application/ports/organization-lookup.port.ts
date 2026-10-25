export const ORGANIZATION_LOOKUP = Symbol('INVENTORY_ORGANIZATION_LOOKUP');

/**
 * Inventory's own view of the organizations context: whether an
 * organization exists and which organization owns a restaurant.
 */
export interface OrganizationLookupPort {
  organizationExists(organizationId: string): Promise<boolean>;
  findRestaurantOrganizationId(restaurantId: string): Promise<string | null>;
}
