import { RestaurantFloor } from '../entities/restaurant-floor.entity.js';
import type { Page, PageRequest } from '../../../common/domain/pagination.js';

export const RESTAURANT_FLOOR_REPOSITORY = Symbol('RESTAURANT_FLOOR_REPOSITORY');

export interface RestaurantFloorRepository {
  findById(id: string): Promise<RestaurantFloor | null>;
  findByName(restaurantId: string, name: string): Promise<RestaurantFloor | null>;
  findPage(
    filter: { restaurantId?: string },
    page: PageRequest,
  ): Promise<Page<RestaurantFloor>>;
  /** Every floor of the restaurant, active or not, in display order. */
  findByRestaurant(restaurantId: string): Promise<RestaurantFloor[]>;
  save(floor: RestaurantFloor): Promise<RestaurantFloor>;
  delete(id: string): Promise<boolean>;
}
