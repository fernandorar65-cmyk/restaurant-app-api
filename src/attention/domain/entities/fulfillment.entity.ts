import { GeoCoordinates } from '../../../common/domain/value-objects/geo-coordinates.js';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import { FulfillmentStatus } from '../enums/fulfillment-status.enum.js';
import { FulfillmentType } from '../enums/fulfillment-type.enum.js';
import {
  InvalidFulfillmentTransitionError,
  InvalidServiceSetupError,
} from '../exceptions/attention.errors.js';

const S = FulfillmentStatus;

/**
 * Pickup ends at the counter (READY -> COMPLETED); delivery goes out first
 * (READY -> OUT_FOR_DELIVERY -> COMPLETED). Any non-final state can be
 * cancelled; COMPLETED and CANCELLED are final.
 */
const TRANSITIONS: Record<FulfillmentType, Record<FulfillmentStatus, FulfillmentStatus[]>> = {
  [FulfillmentType.PICKUP]: {
    [S.PENDING]: [S.CONFIRMED, S.CANCELLED],
    [S.CONFIRMED]: [S.PREPARING, S.CANCELLED],
    [S.PREPARING]: [S.READY, S.CANCELLED],
    [S.READY]: [S.COMPLETED, S.CANCELLED],
    [S.OUT_FOR_DELIVERY]: [],
    [S.COMPLETED]: [],
    [S.CANCELLED]: [],
  },
  [FulfillmentType.DELIVERY]: {
    [S.PENDING]: [S.CONFIRMED, S.CANCELLED],
    [S.CONFIRMED]: [S.PREPARING, S.CANCELLED],
    [S.PREPARING]: [S.READY, S.CANCELLED],
    [S.READY]: [S.OUT_FOR_DELIVERY, S.CANCELLED],
    [S.OUT_FOR_DELIVERY]: [S.COMPLETED, S.CANCELLED],
    [S.COMPLETED]: [],
    [S.CANCELLED]: [],
  },
};

export interface FulfillmentProps {
  id: string;
  attentionId: string;
  type: FulfillmentType;
  status: FulfillmentStatus;
  customerName: string;
  customerPhone: string;
  scheduledAt: Date | null;
  estimatedReadyAt: Date | null;
  deliveryAddress: string | null;
  deliveryReference: string | null;
  latitude: number | null;
  longitude: number | null;
  deliveryFee: number;
  eatAtRestaurant: boolean | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FulfillmentDetails {
  customerName: string;
  customerPhone: string;
  scheduledAt?: Date | null;
  deliveryAddress?: string | null;
  deliveryReference?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  eatAtRestaurant?: boolean | null;
}

/** Pickup / delivery details of an attention (at most one per attention). */
export class Fulfillment {
  private constructor(private props: FulfillmentProps) {}

  static create(
    params: FulfillmentDetails & {
      id: string;
      attentionId: string;
      type: FulfillmentType;
      deliveryFee?: number;
    },
  ): Fulfillment {
    if (params.type === FulfillmentType.DELIVERY && !params.deliveryAddress?.trim()) {
      throw new InvalidServiceSetupError('DELIVERY requiere una dirección de entrega');
    }
    const coordinates = GeoCoordinates.createOptional(
      params.latitude,
      params.longitude,
    );
    const now = new Date();
    return new Fulfillment({
      id: params.id,
      attentionId: params.attentionId,
      type: params.type,
      status: FulfillmentStatus.PENDING,
      customerName: requireText(params.customerName, 'El nombre de contacto', {
        max: 150,
      }),
      customerPhone: requireText(params.customerPhone, 'El teléfono de contacto', {
        max: 30,
      }),
      scheduledAt: params.scheduledAt ?? null,
      estimatedReadyAt: null,
      deliveryAddress: params.deliveryAddress ?? null,
      deliveryReference: params.deliveryReference ?? null,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      deliveryFee: params.deliveryFee ?? 0,
      eatAtRestaurant: params.eatAtRestaurant ?? null,
      deliveredAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: FulfillmentProps): Fulfillment {
    return new Fulfillment(props);
  }

  changeStatus(
    target: FulfillmentStatus,
    options: { estimatedReadyAt?: Date | null } = {},
  ): void {
    const { type, status } = this.props;
    if (!TRANSITIONS[type][status].includes(target)) {
      throw new InvalidFulfillmentTransitionError(type, status, target);
    }
    this.props.status = target;
    if (options.estimatedReadyAt !== undefined) {
      this.props.estimatedReadyAt = options.estimatedReadyAt;
    }
    if (target === S.COMPLETED) {
      this.props.deliveredAt = new Date();
    }
    this.props.updatedAt = new Date();
  }

  get isFinal(): boolean {
    return this.props.status === S.COMPLETED || this.props.status === S.CANCELLED;
  }

  get id(): string {
    return this.props.id;
  }
  get attentionId(): string {
    return this.props.attentionId;
  }
  get type(): FulfillmentType {
    return this.props.type;
  }
  get status(): FulfillmentStatus {
    return this.props.status;
  }
  get customerName(): string {
    return this.props.customerName;
  }
  get customerPhone(): string {
    return this.props.customerPhone;
  }
  get scheduledAt(): Date | null {
    return this.props.scheduledAt;
  }
  get estimatedReadyAt(): Date | null {
    return this.props.estimatedReadyAt;
  }
  get deliveryAddress(): string | null {
    return this.props.deliveryAddress;
  }
  get deliveryReference(): string | null {
    return this.props.deliveryReference;
  }
  get latitude(): number | null {
    return this.props.latitude;
  }
  get longitude(): number | null {
    return this.props.longitude;
  }
  get deliveryFee(): number {
    return this.props.deliveryFee;
  }
  get eatAtRestaurant(): boolean | null {
    return this.props.eatAtRestaurant;
  }
  get deliveredAt(): Date | null {
    return this.props.deliveredAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
