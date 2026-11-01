import { RestaurantReferenceNotFoundError } from '../domain/exceptions/catalog.errors.js';
import type {
  TenantLookup,
  TenantRestaurant,
} from '../../common/application/ports/tenant-lookup.port.js';

export async function requireRestaurant(
  lookup: TenantLookup,
  restaurantId: string,
): Promise<TenantRestaurant> {
  const restaurant = await lookup.findRestaurant(restaurantId);
  if (!restaurant) {
    throw new RestaurantReferenceNotFoundError(restaurantId);
  }
  return restaurant;
}
