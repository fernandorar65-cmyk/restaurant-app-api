import { Injectable } from '@nestjs/common';
import { RestaurantOrderModesService } from '../../../organizations/application/restaurant-order-modes/restaurant-order-modes.service.js';
import { RestaurantsService } from '../../../organizations/application/restaurants/restaurants.service.js';
import { OrderMode } from '../../../organizations/domain/enums/order-mode.enum.js';
import { RestaurantNotFoundError } from '../../../organizations/domain/exceptions/restaurant.errors.js';
import {
  OrderModeSnapshot,
  RestaurantLookupPort,
  RestaurantSnapshot,
} from '../../application/ports/restaurant-lookup.port.js';
import { ServiceType } from '../../domain/enums/service-type.enum.js';

/** In-process adapter over organizations' restaurant services. */
@Injectable()
export class InternalRestaurantLookupAdapter implements RestaurantLookupPort {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly orderModesService: RestaurantOrderModesService,
  ) {}

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

  async findOrderMode(
    restaurantId: string,
    serviceType: ServiceType,
  ): Promise<OrderModeSnapshot> {
    const orderMode = await this.orderModesService.resolve(
      restaurantId,
      OrderMode[serviceType],
    );
    return {
      isEnabled: orderMode.isEnabled,
      minimumAmount: orderMode.minimumAmount,
      deliveryFee: orderMode.deliveryFee,
    };
  }
}
