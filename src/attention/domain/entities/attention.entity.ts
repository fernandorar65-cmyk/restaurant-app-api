import { randomBytes } from 'node:crypto';
import { AttentionStatus } from '../enums/attention-status.enum.js';
import { ServiceType } from '../enums/service-type.enum.js';
import {
  AttentionHasPaymentsError,
  AttentionNotActiveError,
  InvalidServiceSetupError,
  OutstandingBalanceError,
} from '../exceptions/attention.errors.js';

export interface AttentionProps {
  id: string;
  restaurantId: string;
  diningTableId: string | null;
  customerUserId: string | null;
  attentionNumber: string;
  serviceType: ServiceType;
  status: AttentionStatus;
  billRequestedAt: Date | null;
  openedAt: Date;
  closedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ACTIVE_STATUSES = [AttentionStatus.OPEN, AttentionStatus.BILL_REQUESTED];

/**
 * A whole visit / commercial account. For a table it starts with the first
 * round and ends when it is paid (CLOSED) or CANCELLED.
 */
export class Attention {
  private constructor(private props: AttentionProps) {}

  static open(params: {
    id: string;
    restaurantId: string;
    serviceType: ServiceType;
    diningTableId?: string | null;
    customerUserId?: string | null;
  }): Attention {
    const diningTableId = params.diningTableId ?? null;
    if (params.serviceType === ServiceType.DINE_IN && !diningTableId) {
      throw new InvalidServiceSetupError('DINE_IN requires a dining table');
    }
    if (params.serviceType !== ServiceType.DINE_IN && diningTableId) {
      throw new InvalidServiceSetupError(
        `${params.serviceType} attentions cannot be linked to a table`,
      );
    }
    const now = new Date();
    return new Attention({
      id: params.id,
      restaurantId: params.restaurantId,
      diningTableId,
      customerUserId: params.customerUserId ?? null,
      attentionNumber: generateAttentionNumber(),
      serviceType: params.serviceType,
      status: AttentionStatus.OPEN,
      billRequestedAt: null,
      openedAt: now,
      closedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      version: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: AttentionProps): Attention {
    return new Attention(props);
  }

  get isActive(): boolean {
    return ACTIVE_STATUSES.includes(this.props.status);
  }

  /** A new round after asking for the bill re-opens the account. */
  acceptRound(): void {
    this.assertActive();
    if (this.props.status === AttentionStatus.BILL_REQUESTED) {
      this.props.status = AttentionStatus.OPEN;
      this.props.billRequestedAt = null;
    }
    this.touch();
  }

  requestBill(): void {
    this.assertActive();
    if (this.props.status === AttentionStatus.BILL_REQUESTED) {
      return;
    }
    this.props.status = AttentionStatus.BILL_REQUESTED;
    this.props.billRequestedAt = new Date();
    this.touch();
  }

  /** Only possible once everything billable has been paid. */
  close(outstandingBalance: number): void {
    this.assertActive();
    if (outstandingBalance !== 0) {
      throw new OutstandingBalanceError(outstandingBalance);
    }
    this.props.status = AttentionStatus.CLOSED;
    this.props.closedAt = new Date();
    this.touch();
  }

  /** Paid attentions must be refunded first; cancelling never hides money. */
  cancel(reason: string, paidAmount: number): void {
    this.assertActive();
    if (paidAmount > 0) {
      throw new AttentionHasPaymentsError();
    }
    this.props.status = AttentionStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.props.cancellationReason = reason;
    this.touch();
  }

  private assertActive(): void {
    if (!this.isActive) {
      throw new AttentionNotActiveError(this.props.status);
    }
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get diningTableId(): string | null {
    return this.props.diningTableId;
  }
  get customerUserId(): string | null {
    return this.props.customerUserId;
  }
  get attentionNumber(): string {
    return this.props.attentionNumber;
  }
  get serviceType(): ServiceType {
    return this.props.serviceType;
  }
  get status(): AttentionStatus {
    return this.props.status;
  }
  get billRequestedAt(): Date | null {
    return this.props.billRequestedAt;
  }
  get openedAt(): Date {
    return this.props.openedAt;
  }
  get closedAt(): Date | null {
    return this.props.closedAt;
  }
  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }
  get cancellationReason(): string | null {
    return this.props.cancellationReason;
  }
  get version(): number {
    return this.props.version;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

const NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Short human-friendly code (e.g. "A-7KX2QF"), unique per restaurant. */
function generateAttentionNumber(): string {
  const bytes = randomBytes(6);
  const suffix = Array.from(bytes, (byte) => NUMBER_ALPHABET[byte % NUMBER_ALPHABET.length]).join('');
  return `A-${suffix}`;
}
