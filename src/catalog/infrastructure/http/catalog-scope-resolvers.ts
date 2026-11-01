import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ScopeResolverRegistry } from '../../../common/infrastructure/http/access/scope-resolver.registry.js';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.js';
import type { CategoryRepository } from '../../domain/repositories/category.repository.js';
import { MENU_REPOSITORY } from '../../domain/repositories/menu.repository.js';
import type { MenuRepository } from '../../domain/repositories/menu.repository.js';
import { PRODUCT_REPOSITORY } from '../../domain/repositories/product.repository.js';
import type { ProductRepository } from '../../domain/repositories/product.repository.js';

/** Tells the authorization guard which tenant each catalog resource belongs to. */
@Injectable()
export class CatalogScopeResolvers implements OnModuleInit {
  constructor(
    private readonly registry: ScopeResolverRegistry,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(MENU_REPOSITORY) private readonly menus: MenuRepository,
  ) {}

  onModuleInit(): void {
    this.registry.register('product', async (id) => {
      const product = await this.products.findById(id);
      return product && { restaurantId: product.restaurantId };
    });
    this.registry.register('category', async (id) => {
      const category = await this.categories.findById(id);
      return category && { organizationId: category.organizationId };
    });
    this.registry.register('menu', async (id) => {
      const menu = await this.menus.findById(id);
      return menu && { restaurantId: menu.restaurantId };
    });
  }
}
