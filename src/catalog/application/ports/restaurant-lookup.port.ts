import type { ServiceMode } from '../../domain/service-mode.js';

export const RESTAURANT_LOOKUP = Symbol('CATALOG_RESTAURANT_LOOKUP');

export interface OrderModeSnapshot {
  isEnabled: boolean;
  minimumAmount: number | null;
  deliveryFee: number | null;
}

export interface RestaurantSnapshot {
  id: string;
  slug: string;
  isActive: boolean;
}

/**
 * Catalog's own view of a restaurant (organizations context), limited to
 * what it needs to scope categories, products and menus.
 */
export interface RestaurantLookupPort {
  findById(restaurantId: string): Promise<RestaurantSnapshot | null>;
  findBySlug(slug: string): Promise<RestaurantSnapshot | null>;
  /** Effective settings of a service mode (defaults when not configured). */
  findOrderMode(restaurantId: string, mode: ServiceMode): Promise<OrderModeSnapshot>;
}
