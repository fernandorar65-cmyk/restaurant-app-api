import { Injectable } from '@nestjs/common';
import {
  RestaurantNotFoundError,
  RestaurantsService,
} from '../../../organizations/public-api.js';
import type {
  PublicRestaurant,
  RestaurantDirectoryPort,
} from '../../application/ports/restaurant-directory.port.js';
import type { Page, PageRequest } from '../../../common/domain/pagination.js';

type Restaurant = Awaited<ReturnType<RestaurantsService['findOne']>>;

/** In-process adapter over the organizations context's restaurants. */
@Injectable()
export class InternalRestaurantDirectoryAdapter implements RestaurantDirectoryPort {
  constructor(private readonly restaurants: RestaurantsService) {}

  async findActivePage(page: PageRequest): Promise<Page<PublicRestaurant>> {
    const found = await this.restaurants.findActivePage(page);
    return { ...found, items: found.items.map(toPublic) };
  }

  findById(id: string): Promise<PublicRestaurant | null> {
    return this.resolve(() => this.restaurants.findOne(id));
  }

  findBySlug(slug: string): Promise<PublicRestaurant | null> {
    return this.resolve(() => this.restaurants.findBySlug(slug));
  }

  private async resolve(
    find: () => Promise<Restaurant>,
  ): Promise<PublicRestaurant | null> {
    try {
      return toPublic(await find());
    } catch (error) {
      if (error instanceof RestaurantNotFoundError) {
        return null;
      }
      throw error;
    }
  }
}

function toPublic(restaurant: Restaurant): PublicRestaurant {
  return {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    description: restaurant.description,
    address: restaurant.address,
    phone: restaurant.phone,
    email: restaurant.email,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    currencyCode: restaurant.currencyCode,
    timezone: restaurant.timezone,
    isActive: restaurant.isActive,
  };
}
