import type { TransactionContext } from '../../../common/domain/transaction-context.js';

export const RESTAURANT_SETUP = Symbol('ORGANIZATIONS_RESTAURANT_SETUP');

/**
 * What other contexts must create for every new restaurant (attention
 * statuses and service types). Runs in the restaurant's transaction and is
 * idempotent.
 */
export interface RestaurantSetupPort {
  provisionDefaults(
    restaurantId: string,
    tx: TransactionContext,
  ): Promise<void>;
}
