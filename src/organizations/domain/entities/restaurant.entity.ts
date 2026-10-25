import {
  CurrencyCode,
  DEFAULT_CURRENCY_CODE,
} from '../../../common/domain/value-objects/currency-code.js';
import { Email } from '../../../common/domain/value-objects/email.js';
import { GeoCoordinates } from '../../../common/domain/value-objects/geo-coordinates.js';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import {
  DEFAULT_TIME_ZONE,
  TimeZone,
} from '../../../common/domain/value-objects/time-zone.js';
import { RestaurantStatus } from '../enums/restaurant-status.enum.js';

export interface RestaurantProps {
  id: string;
  organizationId: string;
  code: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  currencyCode: string;
  timezone: string;
  status: RestaurantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantDetails {
  name?: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  currencyCode?: string;
  timezone?: string;
}

/** A physical location (sede) of an organization. */
export class Restaurant {
  private constructor(private props: RestaurantProps) {}

  static create(
    params: RestaurantDetails & {
      id: string;
      organizationId: string;
      code: string;
      slug: string;
      name: string;
    },
  ): Restaurant {
    const now = new Date();
    const restaurant = new Restaurant({
      id: params.id,
      organizationId: params.organizationId,
      code: requireText(params.code, 'El código del restaurante', { max: 50 }),
      slug: params.slug,
      name: '',
      description: null,
      address: null,
      phone: null,
      email: null,
      latitude: null,
      longitude: null,
      currencyCode: DEFAULT_CURRENCY_CODE,
      timezone: DEFAULT_TIME_ZONE,
      status: RestaurantStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
    restaurant.applyDetails(params);
    return restaurant;
  }

  static fromPersistence(props: RestaurantProps): Restaurant {
    return new Restaurant(props);
  }

  update(params: RestaurantDetails & { status?: RestaurantStatus }): void {
    this.applyDetails(params);
    if (params.status !== undefined) {
      this.props.status = params.status;
    }
    this.props.updatedAt = new Date();
  }

  private applyDetails(params: RestaurantDetails): void {
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre del restaurante', {
        min: 2,
      });
    }
    if (params.description !== undefined) {
      this.props.description = params.description;
    }
    if (params.address !== undefined) {
      this.props.address = params.address;
    }
    if (params.phone !== undefined) {
      this.props.phone = params.phone;
    }
    if (params.email !== undefined) {
      this.props.email = params.email ? Email.create(params.email).value : null;
    }
    if (params.latitude !== undefined || params.longitude !== undefined) {
      const coordinates = GeoCoordinates.createOptional(
        params.latitude === undefined ? this.props.latitude : params.latitude,
        params.longitude === undefined ? this.props.longitude : params.longitude,
      );
      this.props.latitude = coordinates?.latitude ?? null;
      this.props.longitude = coordinates?.longitude ?? null;
    }
    if (params.currencyCode !== undefined) {
      this.props.currencyCode = CurrencyCode.create(params.currencyCode).value;
    }
    if (params.timezone !== undefined) {
      this.props.timezone = TimeZone.create(params.timezone).value;
    }
  }

  get isActive(): boolean {
    return this.props.status === RestaurantStatus.ACTIVE;
  }

  get id(): string {
    return this.props.id;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get code(): string {
    return this.props.code;
  }
  get slug(): string {
    return this.props.slug;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get address(): string | null {
    return this.props.address;
  }
  get phone(): string | null {
    return this.props.phone;
  }
  get email(): string | null {
    return this.props.email;
  }
  get latitude(): number | null {
    return this.props.latitude;
  }
  get longitude(): number | null {
    return this.props.longitude;
  }
  get currencyCode(): string {
    return this.props.currencyCode;
  }
  get timezone(): string {
    return this.props.timezone;
  }
  get status(): RestaurantStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
