import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import { ProductStatus } from '../enums/product-status.enum.js';
import type { ServiceMode } from '../service-mode.js';

export interface ProductProps {
  id: string;
  restaurantId: string;
  code: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  preparationMinutes: number | null;
  isAvailable: boolean;
  isTakeawayAllowed: boolean;
  isDeliveryAllowed: boolean;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDetails {
  code?: string;
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  price?: number;
  preparationMinutes?: number | null;
  isAvailable?: boolean;
  isTakeawayAllowed?: boolean;
  isDeliveryAllowed?: boolean;
}

export type ProductOrderIssue =
  | 'PRODUCT_INACTIVE'
  | 'PRODUCT_UNAVAILABLE'
  | 'MODE_NOT_ALLOWED';

/**
 * A dish or drink offered by a restaurant. Its categories live in the
 * product_categories link (a product can be in several). "status" is the catalog lifecycle
 * (INACTIVE = retired); "isAvailable" is the day-to-day switch (sold out).
 */
export class Product {
  private constructor(private props: ProductProps) {}

  static create(
    params: ProductDetails & {
      id: string;
      restaurantId: string;
      code: string;
      name: string;
      price: number;
    },
  ): Product {
    const now = new Date();
    const product = new Product({
      id: params.id,
      restaurantId: params.restaurantId,
      code: '',
      name: '',
      description: null,
      imageUrl: null,
      price: 0,
      preparationMinutes: null,
      isAvailable: true,
      isTakeawayAllowed: true,
      isDeliveryAllowed: true,
      status: ProductStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
    product.applyDetails(params);
    return product;
  }

  static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  update(
    params: ProductDetails & { status?: ProductStatus },
  ): void {
    this.applyDetails(params);
    if (params.status !== undefined) {
      this.props.status = params.status;
    }
    this.props.updatedAt = new Date();
  }

  /** Why the product can't be ordered for the given mode, or null if it can. */
  orderIssue(mode: ServiceMode): ProductOrderIssue | null {
    if (this.props.status !== ProductStatus.ACTIVE) {
      return 'PRODUCT_INACTIVE';
    }
    if (!this.props.isAvailable) {
      return 'PRODUCT_UNAVAILABLE';
    }
    if (mode === 'PICKUP' && !this.props.isTakeawayAllowed) {
      return 'MODE_NOT_ALLOWED';
    }
    if (mode === 'DELIVERY' && !this.props.isDeliveryAllowed) {
      return 'MODE_NOT_ALLOWED';
    }
    return null;
  }

  private applyDetails(params: ProductDetails): void {
    if (params.code !== undefined) {
      this.props.code = requireText(params.code, 'El código del producto', {
        max: 50,
      });
    }
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre del producto', {
        min: 2,
        max: 150,
      });
    }
    if (params.description !== undefined) {
      this.props.description = params.description;
    }
    if (params.imageUrl !== undefined) {
      this.props.imageUrl = params.imageUrl;
    }
    if (params.price !== undefined) {
      if (params.price < 0) {
        throw new ValidationDomainError('El precio del producto no puede ser negativo');
      }
      this.props.price = params.price;
    }
    if (params.preparationMinutes !== undefined) {
      if (params.preparationMinutes !== null && params.preparationMinutes < 0) {
        throw new ValidationDomainError(
          'El tiempo de preparación no puede ser negativo',
        );
      }
      this.props.preparationMinutes = params.preparationMinutes;
    }
    if (params.isAvailable !== undefined) {
      this.props.isAvailable = params.isAvailable;
    }
    if (params.isTakeawayAllowed !== undefined) {
      this.props.isTakeawayAllowed = params.isTakeawayAllowed;
    }
    if (params.isDeliveryAllowed !== undefined) {
      this.props.isDeliveryAllowed = params.isDeliveryAllowed;
    }
  }

  get id(): string {
    return this.props.id;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get code(): string {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get imageUrl(): string | null {
    return this.props.imageUrl;
  }
  get price(): number {
    return this.props.price;
  }
  get preparationMinutes(): number | null {
    return this.props.preparationMinutes;
  }
  get isAvailable(): boolean {
    return this.props.isAvailable;
  }
  get isTakeawayAllowed(): boolean {
    return this.props.isTakeawayAllowed;
  }
  get isDeliveryAllowed(): boolean {
    return this.props.isDeliveryAllowed;
  }
  get status(): ProductStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
