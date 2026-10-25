import { Restaurant } from '../entities/restaurant.entity.js';

export const RESTAURANT_REPOSITORY = Symbol('RESTAURANT_REPOSITORY');

export interface RestaurantRepository {
  findById(id: string): Promise<Restaurant | null>;
  findBySlug(slug: string): Promise<Restaurant | null>;
  findAll(): Promise<Restaurant[]>;
  save(restaurant: Restaurant): Promise<Restaurant>;
  delete(id: string): Promise<boolean>;
}
