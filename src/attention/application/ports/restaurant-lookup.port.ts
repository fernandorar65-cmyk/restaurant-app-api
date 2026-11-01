export const RESTAURANT_LOOKUP = Symbol('ATTENTION_RESTAURANT_LOOKUP');

export interface RestaurantSnapshot {
  id: string;
  isActive: boolean;
}

export interface RestaurantLookupPort {
  findById(restaurantId: string): Promise<RestaurantSnapshot | null>;
}
