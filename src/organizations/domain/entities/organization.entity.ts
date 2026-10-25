import {
  CurrencyCode,
  DEFAULT_CURRENCY_CODE,
} from '../../../common/domain/value-objects/currency-code.js';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import {
  DEFAULT_TIME_ZONE,
  TimeZone,
} from '../../../common/domain/value-objects/time-zone.js';
import { OrganizationStatus } from '../enums/organization-status.enum.js';

export interface OrganizationProps {
  id: string;
  name: string;
  legalName: string | null;
  taxIdentifier: string | null;
  currencyCode: string;
  timezone: string;
  status: OrganizationStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** The company, chain or tenant that owns restaurants, staff and data. */
export class Organization {
  private constructor(private props: OrganizationProps) {}

  static create(params: {
    id: string;
    name: string;
    legalName?: string | null;
    taxIdentifier?: string | null;
    currencyCode?: string;
    timezone?: string;
  }): Organization {
    const now = new Date();
    return new Organization({
      id: params.id,
      name: requireText(params.name, 'El nombre de la organización', { min: 2 }),
      legalName: params.legalName ?? null,
      taxIdentifier: params.taxIdentifier?.trim() || null,
      currencyCode: CurrencyCode.create(
        params.currencyCode ?? DEFAULT_CURRENCY_CODE,
      ).value,
      timezone: TimeZone.create(params.timezone ?? DEFAULT_TIME_ZONE).value,
      status: OrganizationStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: OrganizationProps): Organization {
    return new Organization(props);
  }

  update(params: {
    name?: string;
    legalName?: string | null;
    taxIdentifier?: string | null;
    currencyCode?: string;
    timezone?: string;
    status?: OrganizationStatus;
  }): void {
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre de la organización', {
        min: 2,
      });
    }
    if (params.legalName !== undefined) {
      this.props.legalName = params.legalName;
    }
    if (params.taxIdentifier !== undefined) {
      this.props.taxIdentifier = params.taxIdentifier?.trim() || null;
    }
    if (params.currencyCode !== undefined) {
      this.props.currencyCode = CurrencyCode.create(params.currencyCode).value;
    }
    if (params.timezone !== undefined) {
      this.props.timezone = TimeZone.create(params.timezone).value;
    }
    if (params.status !== undefined) {
      this.props.status = params.status;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get legalName(): string | null {
    return this.props.legalName;
  }
  get taxIdentifier(): string | null {
    return this.props.taxIdentifier;
  }
  get currencyCode(): string {
    return this.props.currencyCode;
  }
  get timezone(): string {
    return this.props.timezone;
  }
  get status(): OrganizationStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
