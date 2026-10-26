import { InventoryCategory } from '../entities/inventory-category.entity.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export const INVENTORY_CATEGORY_REPOSITORY = Symbol('INVENTORY_CATEGORY_REPOSITORY');

export interface InventoryCategoryRepository {
  findById(id: string): Promise<InventoryCategory | null>;
  findByName(organizationId: string, name: string): Promise<InventoryCategory | null>;
  findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<InventoryCategory>>;
  save(category: InventoryCategory): Promise<InventoryCategory>;
  delete(id: string): Promise<boolean>;
}
