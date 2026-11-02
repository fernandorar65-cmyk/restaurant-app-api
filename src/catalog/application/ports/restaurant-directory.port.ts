import type { Page, PageRequest } from '../../../common/domain/pagination.js';

export const RESTAURANT_DIRECTORY = Symbol('CATALOG_RESTAURANT_DIRECTORY');

/** What a diner may see of a restaurant (organizations context). */
export interface PublicRestaurant {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  currencyCode: string;
  timezone: string;
  isActive: boolean;
}

export interface RestaurantDirectoryPort {
  /** Only active restaurants. */
  findActivePage(page: PageRequest): Promise<Page<PublicRestaurant>>;
  findById(id: string): Promise<PublicRestaurant | null>;
  findBySlug(slug: string): Promise<PublicRestaurant | null>;
}
