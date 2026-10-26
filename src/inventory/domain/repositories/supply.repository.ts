import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { Supply } from '../entities/supply.entity.js';

export const SUPPLY_REPOSITORY = Symbol('SUPPLY_REPOSITORY');

export interface SupplyRepository {
  findById(id: string): Promise<Supply | null>;
  findByIds(ids: string[]): Promise<Supply[]>;
  findByCode(organizationId: string, code: string): Promise<Supply | null>;
  findPage(
    filter: { organizationId?: string; categoryId?: string; isActive?: boolean },
    page: PageRequest,
  ): Promise<Page<Supply>>;
  save(supply: Supply): Promise<Supply>;
}
