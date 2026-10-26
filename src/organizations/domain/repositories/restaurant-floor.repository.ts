import { RestaurantFloor } from '../entities/restaurant-floor.entity.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export const RESTAURANT_FLOOR_REPOSITORY = Symbol('RESTAURANT_FLOOR_REPOSITORY');

export interface RestaurantFloorRepository {
  findById(id: string): Promise<RestaurantFloor | null>;
  findByName(restaurantId: string, name: string): Promise<RestaurantFloor | null>;
  findPage(
    filter: { restaurantId?: string },
    page: PageRequest,
  ): Promise<Page<RestaurantFloor>>;
  save(floor: RestaurantFloor): Promise<RestaurantFloor>;
  delete(id: string): Promise<boolean>;
}
