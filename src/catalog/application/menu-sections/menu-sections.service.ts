import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MenuSection } from '../../domain/entities/menu-section.entity.js';
import type { MenuSectionDetails } from '../../domain/entities/menu-section.entity.js';
import {
  DuplicateMenuSectionNameError,
  MenuSectionNotFoundError,
} from '../../domain/exceptions/catalog.errors.js';
import { MENU_SECTION_REPOSITORY } from '../../domain/repositories/menu-section.repository.js';
import type { MenuSectionRepository } from '../../domain/repositories/menu-section.repository.js';
import { CategoriesService } from '../categories/categories.service.js';
import { MenusService } from '../menus/menus.service.js';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { planReorder } from '../../domain/services/reorder.js';
import { TENANT_LOOKUP } from '../../../common/application/ports/tenant-lookup.port.js';
import type { TenantLookup } from '../../../common/application/ports/tenant-lookup.port.js';
import { requireRestaurant } from '../restaurant-guard.js';

/** Visible sections of a menu (Entradas, Promociones...). */
@Injectable()
export class MenuSectionsService {
  constructor(
    @Inject(MENU_SECTION_REPOSITORY)
    private readonly sectionRepository: MenuSectionRepository,
    @Inject(TENANT_LOOKUP)
    private readonly restaurantLookup: TenantLookup,
    private readonly menusService: MenusService,
    private readonly categoriesService: CategoriesService,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
  ) {}

  async create(
    menuId: string,
    input: MenuSectionDetails & { name: string },
  ): Promise<MenuSection> {
    await this.assertCategoryFitsMenu(menuId, input.categoryId);
    const section = MenuSection.create({ id: randomUUID(), menuId, ...input });
    await this.assertNameIsFree(section);
    return this.sectionRepository.save(section);
  }

  async list(menuId: string): Promise<MenuSection[]> {
    await this.menusService.findOne(menuId);
    return this.sectionRepository.findByMenu(menuId);
  }

  /** New order of all the menu's sections (hidden ones included), in one request. */
  async reorder(menuId: string, sectionIds: string[]): Promise<MenuSection[]> {
    const sections = await this.list(menuId);
    const positions = planReorder(
      sections.map((section) => section.id),
      sectionIds,
    );
    await this.transactionRunner.run(async (tx) => {
      for (const section of sections) {
        section.update({ sortOrder: positions.get(section.id)! });
        await this.sectionRepository.save(section, tx);
      }
    });
    return sections.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /** Also activates / deactivates through isActive. */
  async update(
    menuId: string,
    sectionId: string,
    input: MenuSectionDetails,
  ): Promise<MenuSection> {
    const section = await this.findOne(menuId, sectionId);
    if (input.categoryId && input.categoryId !== section.categoryId) {
      await this.assertCategoryFitsMenu(menuId, input.categoryId);
    }
    section.update(input);
    await this.assertNameIsFree(section);
    return this.sectionRepository.save(section);
  }

  /** Products stay in the menu; the section just stops being shown. */
  async deactivate(menuId: string, sectionId: string): Promise<void> {
    await this.update(menuId, sectionId, { isActive: false });
  }

  private async findOne(menuId: string, sectionId: string): Promise<MenuSection> {
    const section = await this.sectionRepository.findById(sectionId);
    if (!section || section.menuId !== menuId) {
      throw new MenuSectionNotFoundError(sectionId);
    }
    return section;
  }

  /** The reused category must belong to the organization of the menu's restaurant. */
  private async assertCategoryFitsMenu(
    menuId: string,
    categoryId: string | null | undefined,
  ): Promise<void> {
    const menu = await this.menusService.findOne(menuId);
    if (!categoryId) {
      return;
    }
    const restaurant = await requireRestaurant(this.restaurantLookup, menu.restaurantId);
    await this.categoriesService.findAssignable(restaurant.organizationId, categoryId);
  }

  private async assertNameIsFree(section: MenuSection): Promise<void> {
    const existing = await this.sectionRepository.findByName(section.menuId, section.name);
    if (existing && existing.id !== section.id) {
      throw new DuplicateMenuSectionNameError(section.name);
    }
  }
}
