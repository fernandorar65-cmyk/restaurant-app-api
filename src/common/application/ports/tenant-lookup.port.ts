export const TENANT_LOOKUP = Symbol('TENANT_LOOKUP');

/** A restaurant (sede) as the other contexts need it to scope their data. */
export interface TenantRestaurant {
  id: string;
  organizationId: string;
  slug: string;
  isActive: boolean;
  currencyCode: string;
  timeZone: string;
}

/**
 * Shared kernel of the multi-tenant model: every context checks the
 * organization or restaurant its data belongs to through this port, which
 * the organizations context implements once.
 */
export interface TenantLookup {
  organizationExists(organizationId: string): Promise<boolean>;
  findRestaurant(restaurantId: string): Promise<TenantRestaurant | null>;
  findRestaurantBySlug(slug: string): Promise<TenantRestaurant | null>;
}
