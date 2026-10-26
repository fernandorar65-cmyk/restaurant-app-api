import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { OrderMode } from '../enums/order-mode.enum.js';

export interface RestaurantOrderModeProps {
  restaurantId: string;
  mode: OrderMode;
  isEnabled: boolean;
  minimumAmount: number | null;
  deliveryFee: number | null;
  configuration: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderModeSettings {
  isEnabled?: boolean;
  minimumAmount?: number | null;
  deliveryFee?: number | null;
  configuration?: Record<string, unknown>;
}

/**
 * How a restaurant serves one mode (dine-in, pickup, delivery). A restaurant
 * without a row for a mode falls back to defaultFor(): only DINE_IN is on,
 * pickup and delivery must be enabled explicitly.
 */
export class RestaurantOrderMode {
  private constructor(private props: RestaurantOrderModeProps) {}

  static create(
    params: OrderModeSettings & { restaurantId: string; mode: OrderMode },
  ): RestaurantOrderMode {
    const now = new Date();
    const orderMode = new RestaurantOrderMode({
      restaurantId: params.restaurantId,
      mode: params.mode,
      isEnabled: true,
      minimumAmount: null,
      deliveryFee: null,
      configuration: {},
      createdAt: now,
      updatedAt: now,
    });
    orderMode.configure(params);
    return orderMode;
  }

  /** Effective settings for a mode the restaurant never configured. */
  static defaultFor(restaurantId: string, mode: OrderMode): RestaurantOrderMode {
    const orderMode = RestaurantOrderMode.create({ restaurantId, mode });
    orderMode.props.isEnabled = mode === OrderMode.DINE_IN;
    return orderMode;
  }

  static fromPersistence(props: RestaurantOrderModeProps): RestaurantOrderMode {
    return new RestaurantOrderMode(props);
  }

  configure(params: OrderModeSettings): void {
    if (params.isEnabled !== undefined) {
      this.props.isEnabled = params.isEnabled;
    }
    if (params.minimumAmount !== undefined) {
      if (params.minimumAmount !== null && params.minimumAmount < 0) {
        throw new ValidationDomainError('El monto mínimo no puede ser negativo');
      }
      this.props.minimumAmount = params.minimumAmount;
    }
    if (params.deliveryFee !== undefined) {
      if (params.deliveryFee !== null && params.deliveryFee < 0) {
        throw new ValidationDomainError('El costo de envío no puede ser negativo');
      }
      if (params.deliveryFee !== null && this.props.mode !== OrderMode.DELIVERY) {
        throw new ValidationDomainError('Solo DELIVERY puede tener costo de envío');
      }
      this.props.deliveryFee = params.deliveryFee;
    }
    if (params.configuration !== undefined) {
      this.props.configuration = params.configuration;
    }
    this.props.updatedAt = new Date();
  }

  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get mode(): OrderMode {
    return this.props.mode;
  }
  get isEnabled(): boolean {
    return this.props.isEnabled;
  }
  get minimumAmount(): number | null {
    return this.props.minimumAmount;
  }
  get deliveryFee(): number | null {
    return this.props.deliveryFee;
  }
  get configuration(): Record<string, unknown> {
    return this.props.configuration;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
