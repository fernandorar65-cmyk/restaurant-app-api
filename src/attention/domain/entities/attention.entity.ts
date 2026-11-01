import { Money } from '../../../common/domain/value-objects/money.js';
import { AttentionStatus } from '../enums/attention-status.enum.js';
import type { FulfillmentMode } from '../enums/fulfillment-mode.enum.js';
import type { StatusRef } from '../workflows.js';
import type { ServiceTypeRef } from './service-type.entity.js';
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
  serviceTypeId: string;
  fulfillmentMode: FulfillmentMode;
  status: StatusRef<AttentionStatus>;
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
 * order and ends when it is paid (CLOSED) or CANCELLED. Its status is a row
 * of the restaurant's catalog; the rules only look at its canonical state.
 */
export class Attention {
  private constructor(private props: AttentionProps) {}

  static open(params: {
    id: string;
    /** Short human-friendly code, unique per restaurant (e.g. "A-7KX2QF"). */
    attentionNumber: string;
    restaurantId: string;
    serviceType: ServiceTypeRef;
    /** The restaurant's initial status (canonical OPEN). */
    status: StatusRef<AttentionStatus>;
    diningTableId?: string | null;
    customerUserId?: string | null;
  }): Attention {
    const diningTableId = params.diningTableId ?? null;
    if (params.serviceType.requiresTable && !diningTableId) {
      throw new InvalidServiceSetupError(
        'Este tipo de servicio requiere una mesa',
      );
    }
    if (!params.serviceType.requiresTable && diningTableId) {
      throw new InvalidServiceSetupError(
        'Este tipo de servicio no puede asociarse a una mesa',
      );
    }
    assertCanonical(params.status, AttentionStatus.OPEN);
    const now = new Date();
    return new Attention({
      id: params.id,
      restaurantId: params.restaurantId,
      diningTableId,
      customerUserId: params.customerUserId ?? null,
      attentionNumber: params.attentionNumber,
      serviceTypeId: params.serviceType.id,
      fulfillmentMode: params.serviceType.fulfillmentMode,
      status: params.status,
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
    return ACTIVE_STATUSES.includes(this.props.status.canonicalState);
  }

  /**
   * A new order after asking for the bill re-opens the account; `open` is the
   * restaurant's status for OPEN.
   */
  acceptOrder(open: StatusRef<AttentionStatus>): void {
    this.assertActive();
    if (this.status === AttentionStatus.BILL_REQUESTED) {
      assertCanonical(open, AttentionStatus.OPEN);
      this.props.status = open;
      this.props.billRequestedAt = null;
    }
    this.touch();
  }

  requestBill(billRequested: StatusRef<AttentionStatus>): void {
    this.assertActive();
    if (this.status === AttentionStatus.BILL_REQUESTED) {
      return;
    }
    assertCanonical(billRequested, AttentionStatus.BILL_REQUESTED);
    this.props.status = billRequested;
    this.props.billRequestedAt = new Date();
    this.touch();
  }

  /** Only possible once everything billable has been paid. */
  close(outstandingBalance: number, closed: StatusRef<AttentionStatus>): void {
    this.assertActive();
    // Compared in cents: a float with leftover error is not a debt.
    if (!Money.of(outstandingBalance).isZero()) {
      throw new OutstandingBalanceError(outstandingBalance);
    }
    assertCanonical(closed, AttentionStatus.CLOSED);
    this.props.status = closed;
    this.props.closedAt = new Date();
    this.touch();
  }

  /** Paid attentions must be refunded first; cancelling never hides money. */
  cancel(
    reason: string,
    paidAmount: number,
    cancelled: StatusRef<AttentionStatus>,
  ): void {
    this.assertActive();
    if (paidAmount > 0) {
      throw new AttentionHasPaymentsError();
    }
    assertCanonical(cancelled, AttentionStatus.CANCELLED);
    this.props.status = cancelled;
    this.props.cancelledAt = new Date();
    this.props.cancellationReason = reason;
    this.touch();
  }

  private assertActive(): void {
    if (!this.isActive) {
      throw new AttentionNotActiveError(this.status);
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
  get serviceTypeId(): string {
    return this.props.serviceTypeId;
  }
  get fulfillmentMode(): FulfillmentMode {
    return this.props.fulfillmentMode;
  }
  /** Canonical state of the current status. */
  get status(): AttentionStatus {
    return this.props.status.canonicalState;
  }
  get statusId(): string {
    return this.props.status.id;
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

function assertCanonical(
  status: StatusRef<AttentionStatus>,
  expected: AttentionStatus,
): void {
  if (status.canonicalState !== expected) {
    throw new Error(
      `Expected a ${expected} status, got ${status.canonicalState}`,
    );
  }
}
