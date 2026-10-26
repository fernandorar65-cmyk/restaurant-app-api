import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Supply } from '../entities/supply.entity.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export const SUPPLY_REPOSITORY = Symbol('SUPPLY_REPOSITORY');

export interface SupplyRepository {
  findById(id: string): Promise<Supply | null>;
  /** Loads the supply locking its row until the transaction ends. */
  findByIdForUpdate(id: string, tx: TransactionContext): Promise<Supply | null>;
  findByCode(restaurantId: string, code: string): Promise<Supply | null>;
  findPage(
    filter: { restaurantId?: string; categoryId?: string },
    page: PageRequest,
  ): Promise<Page<Supply>>;
  save(supply: Supply, tx?: TransactionContext): Promise<Supply>;
  delete(id: string): Promise<boolean>;
}
