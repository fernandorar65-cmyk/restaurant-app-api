import type { Page, PageRequest } from '../../../common/application/pagination.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { RestaurantSupply } from '../entities/restaurant-supply.entity.js';

export const RESTAURANT_SUPPLY_REPOSITORY = Symbol('RESTAURANT_SUPPLY_REPOSITORY');

export interface RestaurantSupplyFilter {
  restaurantId?: string;
  supplyId?: string;
  isActive?: boolean;
  /** Only the ones at or below their minimum. */
  lowStock?: boolean;
}

export interface RestaurantSupplyRepository {
  findById(id: string, tx?: TransactionContext): Promise<RestaurantSupply | null>;
  /** Locks the row until the transaction ends (no lost updates of the balance). */
  findByIdForUpdate(id: string, tx: TransactionContext): Promise<RestaurantSupply | null>;
  findForUpdate(
    restaurantId: string,
    supplyId: string,
    tx: TransactionContext,
  ): Promise<RestaurantSupply | null>;
  find(restaurantId: string, supplyId: string): Promise<RestaurantSupply | null>;
  findPage(filter: RestaurantSupplyFilter, page: PageRequest): Promise<Page<RestaurantSupply>>;
  save(restaurantSupply: RestaurantSupply, tx?: TransactionContext): Promise<RestaurantSupply>;
}
