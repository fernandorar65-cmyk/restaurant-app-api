import { Inject, Injectable } from '@nestjs/common';
import { RestaurantOrderMode } from '../../domain/entities/restaurant-order-mode.entity.js';
import type { OrderModeSettings } from '../../domain/entities/restaurant-order-mode.entity.js';
import { OrderMode } from '../../domain/enums/order-mode.enum.js';
import { RESTAURANT_ORDER_MODE_REPOSITORY } from '../../domain/repositories/restaurant-order-mode.repository.js';
import type { RestaurantOrderModeRepository } from '../../domain/repositories/restaurant-order-mode.repository.js';
import { RestaurantsService } from '../restaurants/restaurants.service.js';

@Injectable()
export class RestaurantOrderModesService {
  constructor(
    @Inject(RESTAURANT_ORDER_MODE_REPOSITORY)
    private readonly orderModeRepository: RestaurantOrderModeRepository,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  /** All three modes with their effective settings (defaults included). */
  async list(restaurantId: string): Promise<RestaurantOrderMode[]> {
    await this.restaurantsService.findOne(restaurantId);
    const configured = await this.orderModeRepository.findByRestaurant(restaurantId);
    return Object.values(OrderMode).map(
      (mode) =>
        configured.find((orderMode) => orderMode.mode === mode) ??
        RestaurantOrderMode.defaultFor(restaurantId, mode),
    );
  }

  async resolve(restaurantId: string, mode: OrderMode): Promise<RestaurantOrderMode> {
    return (
      (await this.orderModeRepository.find(restaurantId, mode)) ??
      RestaurantOrderMode.defaultFor(restaurantId, mode)
    );
  }

  async configure(
    restaurantId: string,
    mode: OrderMode,
    settings: OrderModeSettings,
  ): Promise<RestaurantOrderMode> {
    await this.restaurantsService.findOne(restaurantId);
    const existing = await this.orderModeRepository.find(restaurantId, mode);
    if (existing) {
      existing.configure(settings);
      return this.orderModeRepository.save(existing);
    }
    const defaults = RestaurantOrderMode.defaultFor(restaurantId, mode);
    return this.orderModeRepository.save(
      RestaurantOrderMode.create({
        restaurantId,
        mode,
        isEnabled: defaults.isEnabled,
        ...settings,
      }),
    );
  }
}
