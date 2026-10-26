import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Menu } from '../../domain/entities/menu.entity.js';
import type { MenuDetails } from '../../domain/entities/menu.entity.js';
import { MenuProduct } from '../../domain/entities/menu-product.entity.js';
import { MenuStatus } from '../../domain/enums/menu-status.enum.js';
import {
  CrossRestaurantReferenceError,
  DuplicateMenuNameError,
  DuplicateMenuProductError,
  InactiveMenuSectionError,
  MenuNotFoundError,
  MenuProductNotFoundError,
  MenuSectionNotFoundError,
} from '../../domain/exceptions/catalog.errors.js';
import { MENU_PRODUCT_REPOSITORY } from '../../domain/repositories/menu-product.repository.js';
import type { MenuProductRepository } from '../../domain/repositories/menu-product.repository.js';
import { MENU_SECTION_REPOSITORY } from '../../domain/repositories/menu-section.repository.js';
import type { MenuSectionRepository } from '../../domain/repositories/menu-section.repository.js';
import { MENU_REPOSITORY } from '../../domain/repositories/menu.repository.js';
import type { MenuRepository } from '../../domain/repositories/menu.repository.js';
import { RESTAURANT_LOOKUP } from '../ports/restaurant-lookup.port.js';
import type { RestaurantLookupPort } from '../ports/restaurant-lookup.port.js';
import { ProductsService } from '../products/products.service.js';
import { requireRestaurant } from '../restaurant-guard.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export interface CreateMenuInput extends MenuDetails {
  restaurantId: string;
  name: string;
}

export interface UpdateMenuInput extends MenuDetails {
  status?: MenuStatus;
}

export interface MenuProductInput {
  /** Section of the same menu; null removes the product from its section. */
  menuSectionId?: string | null;
  displayPrice?: number | null;
  sortOrder?: number;
  isVisible?: boolean;
}

@Injectable()
export class MenusService {
  constructor(
    @Inject(MENU_REPOSITORY) private readonly menuRepository: MenuRepository,
    @Inject(MENU_PRODUCT_REPOSITORY)
    private readonly menuProductRepository: MenuProductRepository,
    @Inject(MENU_SECTION_REPOSITORY)
    private readonly sectionRepository: MenuSectionRepository,
    @Inject(RESTAURANT_LOOKUP)
    private readonly restaurantLookup: RestaurantLookupPort,
    private readonly productsService: ProductsService,
  ) {}

  async create(input: CreateMenuInput): Promise<Menu> {
    await requireRestaurant(this.restaurantLookup, input.restaurantId);
    const menu = Menu.create({ id: randomUUID(), ...input });
    await this.assertNameIsFree(menu);
    return this.menuRepository.save(menu);
  }

  findPage(
    filter: { restaurantId?: string },
    page: PageRequest,
  ): Promise<Page<Menu>> {
    return this.menuRepository.findPage(filter, page);
  }

  async findOne(id: string): Promise<Menu> {
    const menu = await this.menuRepository.findById(id);
    if (!menu) {
      throw new MenuNotFoundError(id);
    }
    return menu;
  }

  async update(id: string, input: UpdateMenuInput): Promise<Menu> {
    const menu = await this.findOne(id);
    menu.update(input);
    await this.assertNameIsFree(menu);
    return this.menuRepository.save(menu);
  }

  /**
   * Logical delete: operational history must be kept, so the record is
   * deactivated instead of removed.
   */
  async deactivate(id: string): Promise<void> {
    const menu = await this.findOne(id);
    menu.update({ status: MenuStatus.INACTIVE });
    await this.menuRepository.save(menu);
  }

  async listProducts(menuId: string): Promise<MenuProduct[]> {
    await this.findOne(menuId);
    return this.menuProductRepository.findByMenu(menuId);
  }

  /** Menu and product must belong to the same restaurant. */
  async addProduct(
    menuId: string,
    productId: string,
    input: MenuProductInput,
  ): Promise<MenuProduct> {
    const menu = await this.findOne(menuId);
    const product = await this.productsService.findOne(productId);
    if (product.restaurantId !== menu.restaurantId) {
      throw new CrossRestaurantReferenceError('El producto');
    }
    if (await this.menuProductRepository.find(menuId, productId)) {
      throw new DuplicateMenuProductError();
    }
    await this.assertSectionOfMenu(menuId, input.menuSectionId);
    return this.menuProductRepository.save(
      MenuProduct.create({ menuId, productId, ...input }),
    );
  }

  async updateProduct(
    menuId: string,
    productId: string,
    input: MenuProductInput,
  ): Promise<MenuProduct> {
    const menuProduct = await this.menuProductRepository.find(menuId, productId);
    if (!menuProduct) {
      throw new MenuProductNotFoundError();
    }
    if (input.menuSectionId !== menuProduct.menuSectionId) {
      await this.assertSectionOfMenu(menuId, input.menuSectionId);
    }
    menuProduct.update(input);
    return this.menuProductRepository.save(menuProduct);
  }

  async removeProduct(menuId: string, productId: string): Promise<void> {
    const deleted = await this.menuProductRepository.delete(menuId, productId);
    if (!deleted) {
      throw new MenuProductNotFoundError();
    }
  }

  /** The section must be an active section of this same menu. */
  private async assertSectionOfMenu(
    menuId: string,
    sectionId: string | null | undefined,
  ): Promise<void> {
    if (!sectionId) {
      return;
    }
    const section = await this.sectionRepository.findById(sectionId);
    if (!section || section.menuId !== menuId) {
      throw new MenuSectionNotFoundError(sectionId);
    }
    if (!section.isActive) {
      throw new InactiveMenuSectionError();
    }
  }

  private async assertNameIsFree(menu: Menu): Promise<void> {
    const existing = await this.menuRepository.findByName(
      menu.restaurantId,
      menu.name,
    );
    if (existing && existing.id !== menu.id) {
      throw new DuplicateMenuNameError(menu.name);
    }
  }
}
