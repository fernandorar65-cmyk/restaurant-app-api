import { RestaurantOrderMode } from '../entities/restaurant-order-mode.entity.js';
import { OrderMode } from '../enums/order-mode.enum.js';

export const RESTAURANT_ORDER_MODE_REPOSITORY = Symbol(
  'RESTAURANT_ORDER_MODE_REPOSITORY',
);

export interface RestaurantOrderModeRepository {
  find(restaurantId: string, mode: OrderMode): Promise<RestaurantOrderMode | null>;
  findByRestaurant(restaurantId: string): Promise<RestaurantOrderMode[]>;
  save(orderMode: RestaurantOrderMode): Promise<RestaurantOrderMode>;
}
