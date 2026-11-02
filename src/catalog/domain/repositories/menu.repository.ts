import { Menu } from '../entities/menu.entity.js';
import type { Page, PageRequest } from '../../../common/domain/pagination.js';

export const MENU_REPOSITORY = Symbol('MENU_REPOSITORY');

export interface MenuRepository {
  findById(id: string): Promise<Menu | null>;
  findByName(restaurantId: string, name: string): Promise<Menu | null>;
  /** Every menu of the restaurant, whatever its status. */
  findByRestaurant(restaurantId: string): Promise<Menu[]>;
  findPage(
    filter: { restaurantId?: string },
    page: PageRequest,
  ): Promise<Page<Menu>>;
  save(menu: Menu): Promise<Menu>;
  delete(id: string): Promise<boolean>;
}
