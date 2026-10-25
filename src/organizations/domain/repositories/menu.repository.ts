import { Menu } from '../entities/menu.entity.js';

export const MENU_REPOSITORY = Symbol('MENU_REPOSITORY');

export interface MenuRepository {
  findById(id: string): Promise<Menu | null>;
  findAll(): Promise<Menu[]>;
  save(menu: Menu): Promise<Menu>;
  delete(id: string): Promise<boolean>;
}
