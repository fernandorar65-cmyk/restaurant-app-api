import type { ServiceType } from '../../domain/enums/service-type.enum.js';

export const RESTAURANT_LOOKUP = Symbol('ATTENTION_RESTAURANT_LOOKUP');

export interface RestaurantSnapshot {
  id: string;
  isActive: boolean;
}

export interface OrderModeSnapshot {
  isEnabled: boolean;
  minimumAmount: number | null;
  deliveryFee: number | null;
}

export interface RestaurantLookupPort {
  findById(restaurantId: string): Promise<RestaurantSnapshot | null>;
  /** Effective settings of a service mode (defaults when not configured). */
  findOrderMode(
    restaurantId: string,
    serviceType: ServiceType,
  ): Promise<OrderModeSnapshot>;
}
