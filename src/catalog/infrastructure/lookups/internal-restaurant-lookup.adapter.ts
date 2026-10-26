import { Injectable } from '@nestjs/common';
import { OrganizationsService } from '../../../organizations/application/organizations/organizations.service.js';
import { RestaurantOrderModesService } from '../../../organizations/application/restaurant-order-modes/restaurant-order-modes.service.js';
import { RestaurantsService } from '../../../organizations/application/restaurants/restaurants.service.js';
import { Restaurant } from '../../../organizations/domain/entities/restaurant.entity.js';
import { OrderMode } from '../../../organizations/domain/enums/order-mode.enum.js';
import { OrganizationNotFoundError } from '../../../organizations/domain/exceptions/organization.errors.js';
import { RestaurantNotFoundError } from '../../../organizations/domain/exceptions/restaurant.errors.js';
import {
  OrderModeSnapshot,
  RestaurantLookupPort,
  RestaurantSnapshot,
} from '../../application/ports/restaurant-lookup.port.js';
import type { ServiceMode } from '../../domain/service-mode.js';

/** In-process adapter over organizations' application services. */
@Injectable()
export class InternalRestaurantLookupAdapter implements RestaurantLookupPort {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly orderModesService: RestaurantOrderModesService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async organizationExists(organizationId: string): Promise<boolean> {
    try {
      await this.organizationsService.findOne(organizationId);
      return true;
    } catch (error) {
      if (error instanceof OrganizationNotFoundError) {
        return false;
      }
      throw error;
    }
  }

  async findOrderMode(
    restaurantId: string,
    mode: ServiceMode,
  ): Promise<OrderModeSnapshot> {
    const orderMode = await this.orderModesService.resolve(
      restaurantId,
      OrderMode[mode],
    );
    return {
      isEnabled: orderMode.isEnabled,
      minimumAmount: orderMode.minimumAmount,
      deliveryFee: orderMode.deliveryFee,
    };
  }

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
        organizationId: restaurant.organizationId,
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
