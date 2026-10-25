import { Injectable } from '@nestjs/common';
import { RestaurantsService } from '../../../organizations/application/restaurants/restaurants.service.js';
import { Restaurant } from '../../../organizations/domain/entities/restaurant.entity.js';
import { RestaurantNotFoundError } from '../../../organizations/domain/exceptions/restaurant.errors.js';
import {
  RestaurantLookupPort,
  RestaurantSnapshot,
} from '../../application/ports/restaurant-lookup.port.js';

/** In-process adapter over organizations' RestaurantsService. */
@Injectable()
export class InternalRestaurantLookupAdapter implements RestaurantLookupPort {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  findById(restaurantId: string): Promise<RestaurantSnapshot | null> {
    return this.resolve(() => this.restaurantsService.findOne(restaurantId));
  }

  findBySlug(slug: string): Promise<RestaurantSnapshot | null> {
    return this.resolve(() => this.restaurantsService.findBySlug(slug));
  }

  private async resolve(
    find: () => Promise<Restaurant>,
  ): Promise<RestaurantSnapshot | null> {
    try {
      const restaurant = await find();
      return {
        id: restaurant.id,
        slug: restaurant.slug,
        isActive: restaurant.isActive,
      };
    } catch (error) {
      if (error instanceof RestaurantNotFoundError) {
        return null;
      }
      throw error;
    }
  }
}
