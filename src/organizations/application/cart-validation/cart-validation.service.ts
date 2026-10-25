import { Injectable } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service.js';
import { MenusService } from '../menus/menus.service.js';
import { ProductsService } from '../products/products.service.js';
import { RestaurantsService } from '../restaurants/restaurants.service.js';

export interface CartValidationItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export interface CartValidationInput {
  items: CartValidationItemInput[];
}

export type CartValidationIssueCode =
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_NOT_IN_RESTAURANT'
  | 'PRODUCT_UNAVAILABLE'
  | 'PRICE_CHANGED';

export interface CartValidationIssue {
  productId: string;
  code: CartValidationIssueCode;
  currentPrice?: number;
}

export interface CartValidationResult {
  valid: boolean;
  issues: CartValidationIssue[];
  total: number;
}

@Injectable()
export class CartValidationService {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly menusService: MenusService,
  ) {}

  async validateBySlug(
    slug: string,
    input: CartValidationInput,
  ): Promise<CartValidationResult> {
    const restaurant = await this.restaurantsService.findBySlug(slug);
    const issues: CartValidationIssue[] = [];
    let total = 0;

    for (const item of input.items) {
      const product = await this.productsService.findOne(item.productId).catch(() => null);
      if (!product) {
        issues.push({ productId: item.productId, code: 'PRODUCT_NOT_FOUND' });
        continue;
      }

      const belongsToRestaurant = await this.belongsToRestaurant(
        product.categoryId,
        restaurant.id,
      );
      if (!belongsToRestaurant) {
        issues.push({
          productId: item.productId,
          code: 'PRODUCT_NOT_IN_RESTAURANT',
        });
        continue;
      }

      if (!product.available) {
        issues.push({ productId: item.productId, code: 'PRODUCT_UNAVAILABLE' });
        continue;
      }

      if (item.unitPrice !== undefined && item.unitPrice !== product.price) {
        issues.push({
          productId: item.productId,
          code: 'PRICE_CHANGED',
          currentPrice: product.price,
        });
      }

      total += product.price * item.quantity;
    }

    return { valid: issues.length === 0, issues, total };
  }

  private async belongsToRestaurant(
    categoryId: string,
    restaurantId: string,
  ): Promise<boolean> {
    const category = await this.categoriesService.findOne(categoryId).catch(() => null);
    if (!category) {
      return false;
    }
    const menu = await this.menusService.findOne(category.menuId).catch(() => null);
    return menu?.restaurantId === restaurantId;
  }
}
