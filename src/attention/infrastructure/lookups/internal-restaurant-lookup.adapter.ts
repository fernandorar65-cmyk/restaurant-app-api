import { Injectable } from '@nestjs/common';
import { RestaurantsService } from '../../../organizations/application/restaurants/restaurants.service.js';
import { RestaurantNotFoundError } from '../../../organizations/domain/exceptions/restaurant.errors.js';
import {
  RestaurantLookupPort,
  RestaurantSnapshot,
} from '../../application/ports/restaurant-lookup.port.js';

/** In-process adapter over organizations' RestaurantsService. */
@Injectable()
export class InternalRestaurantLookupAdapter implements RestaurantLookupPort {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  async findById(restaurantId: string): Promise<RestaurantSnapshot | null> {
    try {
      const restaurant = await this.restaurantsService.findOne(restaurantId);
      return { id: restaurant.id, isActive: restaurant.isActive };
    } catch (error) {
      if (error instanceof RestaurantNotFoundError) {
        return null;
      }
      throw error;
    }
  }
}
