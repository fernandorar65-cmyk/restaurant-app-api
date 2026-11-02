import { Inject, Injectable } from '@nestjs/common';
import type { Menu } from '../../domain/entities/menu.entity.js';
import type { MenuSection } from '../../domain/entities/menu-section.entity.js';
import { ProductStatus } from '../../domain/enums/product-status.enum.js';
import { RestaurantReferenceNotFoundError } from '../../domain/exceptions/catalog.errors.js';
import { MENU_PRODUCT_REPOSITORY } from '../../domain/repositories/menu-product.repository.js';
import type { MenuProductRepository } from '../../domain/repositories/menu-product.repository.js';
import { MENU_SECTION_REPOSITORY } from '../../domain/repositories/menu-section.repository.js';
import type { MenuSectionRepository } from '../../domain/repositories/menu-section.repository.js';
import { MENU_REPOSITORY } from '../../domain/repositories/menu.repository.js';
import type { MenuRepository } from '../../domain/repositories/menu.repository.js';
import {
  pickCurrentMenu,
  searchMenu,
} from '../../domain/services/storefront.js';
import { RESTAURANT_DIRECTORY } from '../ports/restaurant-directory.port.js';
import type {
  PublicRestaurant,
  RestaurantDirectoryPort,
} from '../ports/restaurant-directory.port.js';
import { SERVICE_TYPE_LOOKUP } from '../ports/service-type-lookup.port.js';
import type {
  ServiceOffer,
  ServiceTypeLookupPort,
} from '../ports/service-type-lookup.port.js';
import { ProductsService } from '../products/products.service.js';
import type { Page, PageRequest } from '../../../common/domain/pagination.js';

export interface StorefrontRestaurant extends PublicRestaurant {
  /** Active service types: dine-in, pickup, delivery with fee and minimum. */
  services: ServiceOffer[];
}

/** A product of the current menu, as the diner's menu shows it. */
export interface StorefrontProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  /** What the order charges. */
  price: number;
  /** Price shown in this menu, when it differs from the order price. */
  displayPrice: number | null;
  preparationMinutes: number | null;
  /** false = sold out today; still listed so the menu can show it. */
  isAvailable: boolean;
  isTakeawayAllowed: boolean;
  isDeliveryAllowed: boolean;
  /** null when the product has no section or its section is hidden. */
  menuSectionId: string | null;
}

export interface StorefrontMenu {
  restaurantId: string;
  /** null when the restaurant has no current menu. */
  menu: Menu | null;
  /** Active sections, in order. */
  sections: MenuSection[];
  /** By section order (products without a section last), then menu order. */
  products: StorefrontProduct[];
}

/**
 * Read side of the catalog for diners: restaurants they can order from and
 * the menu each one offers right now. Only active restaurants are visible;
 * an inactive one answers 404 as if it didn't exist.
 */
@Injectable()
export class StorefrontService {
  constructor(
    @Inject(RESTAURANT_DIRECTORY)
    private readonly restaurants: RestaurantDirectoryPort,
    @Inject(SERVICE_TYPE_LOOKUP)
    private readonly serviceTypes: ServiceTypeLookupPort,
    @Inject(MENU_REPOSITORY) private readonly menuRepository: MenuRepository,
    @Inject(MENU_SECTION_REPOSITORY)
    private readonly sectionRepository: MenuSectionRepository,
    @Inject(MENU_PRODUCT_REPOSITORY)
    private readonly menuProductRepository: MenuProductRepository,
    private readonly productsService: ProductsService,
  ) {}

  async findRestaurantPage(
    page: PageRequest,
  ): Promise<Page<StorefrontRestaurant>> {
    const found = await this.restaurants.findActivePage(page);
    const items = await Promise.all(
      found.items.map((restaurant) => this.withServices(restaurant)),
    );
    return { ...found, items };
  }

  async findRestaurant(id: string): Promise<StorefrontRestaurant> {
    return this.withServices(visible(await this.restaurants.findById(id), id));
  }

  async findRestaurantBySlug(slug: string): Promise<StorefrontRestaurant> {
    return this.withServices(
      visible(await this.restaurants.findBySlug(slug), slug),
    );
  }

  async currentMenu(
    restaurantId: string,
    at: Date = new Date(),
  ): Promise<StorefrontMenu> {
    visible(await this.restaurants.findById(restaurantId), restaurantId);
    const menu = pickCurrentMenu(
      await this.menuRepository.findByRestaurant(restaurantId),
      at,
    );
    if (!menu) {
      return { restaurantId, menu: null, sections: [], products: [] };
    }
    const [allSections, menuProducts] = await Promise.all([
      this.sectionRepository.findByMenu(menu.id),
      this.menuProductRepository.findByMenu(menu.id),
    ]);
    const sections = allSections
      .filter((section) => section.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const sectionOrder = new Map(
      sections.map((section, index) => [section.id, index]),
    );
    const visibleEntries = menuProducts.filter((entry) => entry.isVisible);
    const products = await this.productsService.findByIds(
      visibleEntries.map((entry) => entry.productId),
    );
    const byId = new Map(products.map((product) => [product.id, product]));

    const listed = visibleEntries.flatMap((entry) => {
      const product = byId.get(entry.productId);
      if (
        !product ||
        product.status !== ProductStatus.ACTIVE ||
        product.restaurantId !== restaurantId
      ) {
        return [];
      }
      const menuSectionId =
        entry.menuSectionId && sectionOrder.has(entry.menuSectionId)
          ? entry.menuSectionId
          : null;
      return [
        {
          order: [
            menuSectionId === null
              ? sections.length
              : sectionOrder.get(menuSectionId)!,
            entry.sortOrder,
          ],
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            imageUrl: product.imageUrl,
            price: product.price,
            displayPrice: entry.displayPrice,
            preparationMinutes: product.preparationMinutes,
            isAvailable: product.isAvailable,
            isTakeawayAllowed: product.isTakeawayAllowed,
            isDeliveryAllowed: product.isDeliveryAllowed,
            menuSectionId,
          },
        },
      ];
    });
    listed.sort((a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1]);
    return {
      restaurantId,
      menu,
      sections,
      products: listed.map((entry) => entry.product),
    };
  }

  /** Search box suggestions over the current menu (see searchMenu). */
  async searchCurrentMenu(
    restaurantId: string,
    query: string,
    limit: number,
  ): Promise<StorefrontProduct[]> {
    const { products } = await this.currentMenu(restaurantId);
    return searchMenu(products, query, limit);
  }

  private async withServices(
    restaurant: PublicRestaurant,
  ): Promise<StorefrontRestaurant> {
    return {
      ...restaurant,
      services: await this.serviceTypes.listActive(restaurant.id),
    };
  }
}

function visible(
  restaurant: PublicRestaurant | null,
  idOrSlug: string,
): PublicRestaurant {
  if (!restaurant?.isActive) {
    throw new RestaurantReferenceNotFoundError(idOrSlug);
  }
  return restaurant;
}
