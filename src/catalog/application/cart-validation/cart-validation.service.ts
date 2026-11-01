import { Inject, Injectable } from '@nestjs/common';
import { BusinessRuleDomainError } from '../../../common/domain/domain-error.js';
import { Money } from '../../../common/domain/value-objects/money.js';
import { RestaurantReferenceNotFoundError } from '../../domain/exceptions/catalog.errors.js';
import type { ProductOrderIssue } from '../../domain/entities/product.entity.js';
import type { ServiceMode } from '../../domain/service-mode.js';
import { TENANT_LOOKUP } from '../../../common/application/ports/tenant-lookup.port.js';
import type { TenantLookup } from '../../../common/application/ports/tenant-lookup.port.js';
import { SERVICE_TYPE_LOOKUP } from '../ports/service-type-lookup.port.js';
import type { ServiceTypeLookupPort } from '../ports/service-type-lookup.port.js';
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
  minimumAmount: number;
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
 * service type for the mode (offered, minimum, delivery fee) also applies.
 */
@Injectable()
export class CartValidationService {
  constructor(
    @Inject(TENANT_LOOKUP)
    private readonly restaurantLookup: TenantLookup,
    @Inject(SERVICE_TYPE_LOOKUP)
    private readonly serviceTypeLookup: ServiceTypeLookupPort,
    private readonly productsService: ProductsService,
  ) {}

  async validateBySlug(
    slug: string,
    input: CartValidationInput,
  ): Promise<CartValidationResult> {
    const restaurant = await this.restaurantLookup.findRestaurantBySlug(slug);
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
      const product = products.find(
        (candidate) => candidate.id === item.productId,
      );
      if (!product) {
        issues.push({ productId: item.productId, code: 'PRODUCT_NOT_FOUND' });
        continue;
      }
      if (product.restaurantId !== restaurant.id) {
        issues.push({
          productId: item.productId,
          code: 'PRODUCT_NOT_IN_RESTAURANT',
        });
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
        subtotal: Money.of(product.price).times(item.quantity).amount,
      });
    }

    const subtotal = Money.sum(
      lines.map((line) => Money.of(line.subtotal)),
    ).amount;
    const serviceType = await this.serviceTypeLookup.findActive(
      restaurant.id,
      input.serviceType,
    );
    const serviceIssues: CartServiceIssue[] = [];
    if (!serviceType) {
      serviceIssues.push('MODE_DISABLED');
    }
    const minimumAmount = serviceType?.minimumOrderAmount ?? 0;
    if (subtotal < minimumAmount) {
      serviceIssues.push('BELOW_MINIMUM');
    }
    // Dine-in has no pickup/delivery record, so no fee applies.
    const deliveryFee =
      input.serviceType === 'DINE_IN' ? 0 : (serviceType?.deliveryFee ?? 0);
    return {
      valid: issues.length === 0 && serviceIssues.length === 0,
      issues,
      serviceIssues,
      lines,
      subtotal,
      minimumAmount,
      deliveryFee,
      total: Money.of(subtotal).plus(Money.of(deliveryFee)).amount,
    };
  }
}
