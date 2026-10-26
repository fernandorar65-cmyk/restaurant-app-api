import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Restaurant } from '../entities/restaurant.entity.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export const RESTAURANT_REPOSITORY = Symbol('RESTAURANT_REPOSITORY');

export interface RestaurantRepository {
  findById(id: string, tx?: TransactionContext): Promise<Restaurant | null>;
  findBySlug(slug: string): Promise<Restaurant | null>;
  findByCode(organizationId: string, code: string): Promise<Restaurant | null>;
  findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<Restaurant>>;
  save(restaurant: Restaurant, tx?: TransactionContext): Promise<Restaurant>;
  delete(id: string): Promise<boolean>;
}
