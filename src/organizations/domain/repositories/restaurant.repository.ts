import { Restaurant } from '../entities/restaurant.entity.js';

export const RESTAURANT_REPOSITORY = Symbol('RESTAURANT_REPOSITORY');

export interface RestaurantRepository {
  findById(id: string): Promise<Restaurant | null>;
  findBySlug(slug: string): Promise<Restaurant | null>;
  findByCode(organizationId: string, code: string): Promise<Restaurant | null>;
  findAll(filter?: { organizationId?: string }): Promise<Restaurant[]>;
  save(restaurant: Restaurant): Promise<Restaurant>;
  delete(id: string): Promise<boolean>;
}
