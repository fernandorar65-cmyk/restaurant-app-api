import type { PaymentMethod } from '../../../common/domain/payment-method.enum.js';
import { AllocationConcept } from '../enums/allocation-concept.enum.js';
import { AllocationMode } from '../enums/allocation-mode.enum.js';
import { PaymentStatusCode } from '../enums/payment-status-code.enum.js';
import {
  InvalidPaymentAmountError,
  InvalidPaymentTransitionError,
} from '../exceptions/payment.errors.js';
import { sumAllocations } from '../services/allocation-planner.js';
import { paymentStatusDefinition } from '../status-catalog.js';

export interface PaymentAllocation {
  id: string;
  concept: AllocationConcept;
  orderItemId: string | null;
  amount: number;
  createdAt: Date;
}

export interface ProviderData {
  code: string;
  paymentId: string | null;
  /** Last status exactly as the gateway reported it. */
  status: string | null;
}

export interface PaymentProps {
  id: string;
  organizationId: string;
  restaurantId: string;
  attentionId: string;
  status: PaymentStatusCode;
  method: PaymentMethod;
  mode: AllocationMode;
  amount: number;
  currencyCode: string;
  payerUserId: string | null;
  payerName: string | null;
  /** Manual reference, e.g. the Yape operation number. */
  externalReference: string | null;
  provider: ProviderData | null;
  /** Idempotency key: resubmitting it returns the original payment. */
  requestId: string;
  notes: string | null;
  paidAt: Date | null;
  registeredByUserId: string | null;
  allocations: PaymentAllocation[];
  createdAt: Date;
  updatedAt: Date;
}

const TRANSITIONS: Record<PaymentStatusCode, PaymentStatusCode[]> = {
  [PaymentStatusCode.PENDING]: [
    PaymentStatusCode.PROCESSING,
    PaymentStatusCode.PAID,
    PaymentStatusCode.FAILED,
    PaymentStatusCode.CANCELLED,
  ],
  [PaymentStatusCode.PROCESSING]: [
    PaymentStatusCode.PAID,
    PaymentStatusCode.FAILED,
    PaymentStatusCode.CANCELLED,
  ],
  [PaymentStatusCode.PAID]: [
    PaymentStatusCode.PARTIALLY_REFUNDED,
    PaymentStatusCode.REFUNDED,
  ],
  [PaymentStatusCode.PARTIALLY_REFUNDED]: [PaymentStatusCode.REFUNDED],
  [PaymentStatusCode.FAILED]: [],
  [PaymentStatusCode.CANCELLED]: [],
  [PaymentStatusCode.REFUNDED]: [],
};

/**
 * A movement of money (or an attempt to collect it) for an attention. Its
 * allocations say which products it covers; they exist from the start but
 * only reduce the balance while the status counts toward it. The amount and
 * allocations never change afterwards: refunds are separate records.
 */
export class Payment {
  private constructor(private props: PaymentProps) {}

  static create(
    params: Omit<PaymentProps, 'paidAt' | 'createdAt' | 'updatedAt' | 'allocations'> & {
      allocations: Omit<PaymentAllocation, 'createdAt'>[];
    },
  ): Payment {
    if (params.allocations.length === 0) {
      throw new InvalidPaymentAmountError('El pago debe cubrir al menos un concepto');
    }
    if (params.amount <= 0) {
      throw new InvalidPaymentAmountError('El monto del pago debe ser mayor a 0');
    }
    if (sumAllocations(params.allocations) !== params.amount) {
      throw new InvalidPaymentAmountError(
        'La suma de las asignaciones debe coincidir con el monto del pago',
      );
    }
    const now = new Date();
    return new Payment({
      ...params,
      allocations: params.allocations.map((allocation) => ({ ...allocation, createdAt: now })),
      paidAt: paymentStatusDefinition(params.status).countsTowardBalance ? now : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: PaymentProps): Payment {
    return new Payment(props);
  }

  /**
   * Moves to another internal status. Returns false when it already was in
   * that status, so repeated gateway notifications are harmless.
   */
  changeStatus(target: PaymentStatusCode): boolean {
    if (target === this.props.status) {
      return false;
    }
    if (!TRANSITIONS[this.props.status].includes(target)) {
      throw new InvalidPaymentTransitionError(this.props.status, target);
    }
    this.props.status = target;
    if (target === PaymentStatusCode.PAID && !this.props.paidAt) {
      this.props.paidAt = new Date();
    }
    this.props.updatedAt = new Date();
    return true;
  }

  canMoveTo(target: PaymentStatusCode): boolean {
    return target === this.props.status || TRANSITIONS[this.props.status].includes(target);
  }

  recordProviderStatus(externalStatus: string): void {
    if (this.props.provider) {
      this.props.provider = { ...this.props.provider, status: externalStatus };
      this.props.updatedAt = new Date();
    }
  }

  get id(): string {
    return this.props.id;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get attentionId(): string {
    return this.props.attentionId;
  }
  get status(): PaymentStatusCode {
    return this.props.status;
  }
  get method(): PaymentMethod {
    return this.props.method;
  }
  get mode(): AllocationMode {
    return this.props.mode;
  }
  get amount(): number {
    return this.props.amount;
  }
  get currencyCode(): string {
    return this.props.currencyCode;
  }
  get payerUserId(): string | null {
    return this.props.payerUserId;
  }
  get payerName(): string | null {
    return this.props.payerName;
  }
  get externalReference(): string | null {
    return this.props.externalReference;
  }
  get provider(): ProviderData | null {
    return this.props.provider;
  }
  get requestId(): string {
    return this.props.requestId;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get paidAt(): Date | null {
    return this.props.paidAt;
  }
  get registeredByUserId(): string | null {
    return this.props.registeredByUserId;
  }
  get allocations(): PaymentAllocation[] {
    return this.props.allocations;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
