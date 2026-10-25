import { RestaurantFloor } from '../entities/restaurant-floor.entity.js';

export const RESTAURANT_FLOOR_REPOSITORY = Symbol('RESTAURANT_FLOOR_REPOSITORY');

export interface RestaurantFloorRepository {
  findById(id: string): Promise<RestaurantFloor | null>;
  findByName(restaurantId: string, name: string): Promise<RestaurantFloor | null>;
  findAll(filter?: { restaurantId?: string }): Promise<RestaurantFloor[]>;
  save(floor: RestaurantFloor): Promise<RestaurantFloor>;
  delete(id: string): Promise<boolean>;
}
