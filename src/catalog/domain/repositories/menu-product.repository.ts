import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { MenuProduct } from '../entities/menu-product.entity.js';

export const MENU_PRODUCT_REPOSITORY = Symbol('MENU_PRODUCT_REPOSITORY');

export interface MenuProductRepository {
  find(menuId: string, productId: string): Promise<MenuProduct | null>;
  findByMenu(menuId: string): Promise<MenuProduct[]>;
  save(menuProduct: MenuProduct, tx?: TransactionContext): Promise<MenuProduct>;
  delete(menuId: string, productId: string): Promise<boolean>;
}
