import { RestaurantReferenceNotFoundError } from '../domain/exceptions/catalog.errors.js';
import type {
  RestaurantLookupPort,
  RestaurantSnapshot,
} from './ports/restaurant-lookup.port.js';

export async function requireRestaurant(
  lookup: RestaurantLookupPort,
  restaurantId: string,
): Promise<RestaurantSnapshot> {
  const restaurant = await lookup.findById(restaurantId);
  if (!restaurant) {
    throw new RestaurantReferenceNotFoundError(restaurantId);
  }
  return restaurant;
}
