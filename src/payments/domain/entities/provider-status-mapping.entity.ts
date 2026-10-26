import { requireText } from '../../../common/domain/value-objects/required-text.js';
import type { PaymentStatusCode } from '../enums/payment-status-code.enum.js';

export interface ProviderStatusMappingProps {
  id: string;
  providerCode: string;
  externalStatus: string;
  paymentStatus: PaymentStatusCode;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Normalized gateway code ("Mercado_Pago " -> "mercado_pago"). */
export function normalizeProviderCode(code: string): string {
  return requireText(code, 'El código del proveedor', { max: 50 }).toLowerCase();
}

/**
 * Translates one gateway status into an internal one, e.g.
 * mercado_pago + approved -> PAID, stripe + succeeded -> PAID.
 */
export class ProviderStatusMapping {
  private constructor(private props: ProviderStatusMappingProps) {}

  static create(params: {
    id: string;
    providerCode: string;
    externalStatus: string;
    paymentStatus: PaymentStatusCode;
  }): ProviderStatusMapping {
    const now = new Date();
    return new ProviderStatusMapping({
      id: params.id,
      providerCode: normalizeProviderCode(params.providerCode),
      externalStatus: requireText(params.externalStatus, 'El estado externo', { max: 100 }),
      paymentStatus: params.paymentStatus,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ProviderStatusMappingProps): ProviderStatusMapping {
    return new ProviderStatusMapping(props);
  }

  /** Only affects notifications processed from now on. */
  update(params: { paymentStatus?: PaymentStatusCode; isActive?: boolean }): void {
    if (params.paymentStatus !== undefined) {
      this.props.paymentStatus = params.paymentStatus;
    }
    if (params.isActive !== undefined) {
      this.props.isActive = params.isActive;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get providerCode(): string {
    return this.props.providerCode;
  }
  get externalStatus(): string {
    return this.props.externalStatus;
  }
  get paymentStatus(): PaymentStatusCode {
    return this.props.paymentStatus;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
