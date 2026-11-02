import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { MenuSection } from '../entities/menu-section.entity.js';

export const MENU_SECTION_REPOSITORY = Symbol('MENU_SECTION_REPOSITORY');

export interface MenuSectionRepository {
  findById(id: string): Promise<MenuSection | null>;
  findByMenu(menuId: string): Promise<MenuSection[]>;
  /** Same menu, ignoring case. */
  findByName(menuId: string, name: string): Promise<MenuSection | null>;
  save(section: MenuSection, tx?: TransactionContext): Promise<MenuSection>;
}
