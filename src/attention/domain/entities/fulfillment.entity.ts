import { GeoCoordinates } from '../../../common/domain/value-objects/geo-coordinates.js';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import { FulfillmentStatus } from '../enums/fulfillment-status.enum.js';
import { FulfillmentType } from '../enums/fulfillment-type.enum.js';
import { InvalidServiceSetupError } from '../exceptions/attention.errors.js';

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
      throw new InvalidServiceSetupError('DELIVERY requires a delivery address');
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
