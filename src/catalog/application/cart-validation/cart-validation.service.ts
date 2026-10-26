import { Inject, Injectable } from '@nestjs/common';
import { BusinessRuleDomainError } from '../../../common/domain/domain-error.js';
import { roundMoney } from '../../../common/domain/value-objects/money.js';
import { RestaurantReferenceNotFoundError } from '../../domain/exceptions/catalog.errors.js';
import type { ProductOrderIssue } from '../../domain/entities/product.entity.js';
import type { ServiceMode } from '../../domain/service-mode.js';
import { RESTAURANT_LOOKUP } from '../ports/restaurant-lookup.port.js';
import type { RestaurantLookupPort } from '../ports/restaurant-lookup.port.js';
import { ProductsService } from '../products/products.service.js';

export interface CartValidationItemInput {
  productId: string;
  quantity: number;
  /** Price the browser showed; only used to warn about changes. */
  unitPrice?: number;
}

export interface CartValidationInput {
  serviceType: ServiceMode;
  items: CartValidationItemInput[];
}

export type CartValidationIssueCode =
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_NOT_IN_RESTAURANT'
  | ProductOrderIssue
  | 'PRICE_CHANGED';

export interface CartValidationIssue {
  productId: string;
  code: CartValidationIssueCode;
  currentPrice?: number;
}

export interface CartValidationLine {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** Problems with the order as a whole, not with a specific product. */
export type CartServiceIssue = 'MODE_DISABLED' | 'BELOW_MINIMUM';

export interface CartValidationResult {
  valid: boolean;
  issues: CartValidationIssue[];
  serviceIssues: CartServiceIssue[];
  lines: CartValidationLine[];
  subtotal: number;
  minimumAmount: number | null;
  deliveryFee: number;
  total: number;
}

export class RestaurantNotAcceptingOrdersError extends BusinessRuleDomainError {
  constructor(slug: string) {
    super(`El restaurante "${slug}" no está recibiendo pedidos`);
  }
}

/**
 * Re-checks the cart against the current catalog. Names and prices always
 * come from the server; a price sent by the browser only produces a
 * PRICE_CHANGED warning, it never replaces the real one. The restaurant's
 * settings for the service mode (enabled, minimum, delivery fee) also apply.
 */
@Injectable()
export class CartValidationService {
  constructor(
    @Inject(RESTAURANT_LOOKUP)
    private readonly restaurantLookup: RestaurantLookupPort,
    private readonly productsService: ProductsService,
  ) {}

  async validateBySlug(
    slug: string,
    input: CartValidationInput,
  ): Promise<CartValidationResult> {
    const restaurant = await this.restaurantLookup.findBySlug(slug);
    if (!restaurant) {
      throw new RestaurantReferenceNotFoundError(slug);
    }
    if (!restaurant.isActive) {
      throw new RestaurantNotAcceptingOrdersError(slug);
    }

    const products = await this.productsService.findByIds(
      input.items.map((item) => item.productId),
    );
    const issues: CartValidationIssue[] = [];
    const lines: CartValidationLine[] = [];

    for (const item of input.items) {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) {
        issues.push({ productId: item.productId, code: 'PRODUCT_NOT_FOUND' });
        continue;
      }
      if (product.restaurantId !== restaurant.id) {
        issues.push({ productId: item.productId, code: 'PRODUCT_NOT_IN_RESTAURANT' });
        continue;
      }
      const orderIssue = product.orderIssue(input.serviceType);
      if (orderIssue) {
        issues.push({ productId: item.productId, code: orderIssue });
        continue;
      }
      if (item.unitPrice !== undefined && item.unitPrice !== product.price) {
        issues.push({
          productId: item.productId,
          code: 'PRICE_CHANGED',
          currentPrice: product.price,
        });
      }
      lines.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: roundMoney(product.price * item.quantity),
      });
    }

    const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.subtotal, 0));
    const orderMode = await this.restaurantLookup.findOrderMode(
      restaurant.id,
      input.serviceType,
    );
    const serviceIssues: CartServiceIssue[] = [];
    if (!orderMode.isEnabled) {
      serviceIssues.push('MODE_DISABLED');
    }
    if (orderMode.minimumAmount !== null && subtotal < orderMode.minimumAmount) {
      serviceIssues.push('BELOW_MINIMUM');
    }
    const deliveryFee =
      input.serviceType === 'DELIVERY' ? (orderMode.deliveryFee ?? 0) : 0;
    return {
      valid: issues.length === 0 && serviceIssues.length === 0,
      issues,
      serviceIssues,
      lines,
      subtotal,
      minimumAmount: orderMode.minimumAmount,
      deliveryFee,
      total: roundMoney(subtotal + deliveryFee),
    };
  }
}

