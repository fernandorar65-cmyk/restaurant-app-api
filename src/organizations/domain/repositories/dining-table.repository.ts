import { DiningTable } from '../entities/dining-table.entity.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export const DINING_TABLE_REPOSITORY = Symbol('DINING_TABLE_REPOSITORY');

export interface DiningTableRepository {
  findById(id: string): Promise<DiningTable | null>;
  findByCode(restaurantId: string, code: string): Promise<DiningTable | null>;
  findPage(
    filter: {
    restaurantId?: string;
    floorId?: string;
  },
    page: PageRequest,
  ): Promise<Page<DiningTable>>;
  save(diningTable: DiningTable): Promise<DiningTable>;
  delete(id: string): Promise<boolean>;
}
