import { MenuProduct } from '../entities/menu-product.entity.js';

export const MENU_PRODUCT_REPOSITORY = Symbol('MENU_PRODUCT_REPOSITORY');

export interface MenuProductRepository {
  find(menuId: string, productId: string): Promise<MenuProduct | null>;
  findByMenu(menuId: string): Promise<MenuProduct[]>;
  save(menuProduct: MenuProduct): Promise<MenuProduct>;
  delete(menuId: string, productId: string): Promise<boolean>;
}
