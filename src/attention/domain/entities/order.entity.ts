import { OrderSource } from '../enums/order-source.enum.js';
import { OrderStatus } from '../enums/order-status.enum.js';
import {
  OrderAlreadyFinishedError,
  OrderNotSubmittedError,
} from '../exceptions/attention.errors.js';
import type { StatusCatalog } from '../status-catalog.js';
import type { StatusRef } from '../workflows.js';

const DROPPED_ITEM_STATUSES = [OrderStatus.REJECTED, OrderStatus.CANCELLED];
const FINAL_STATUSES = [OrderStatus.SERVED, OrderStatus.CANCELLED];

export interface OrderProps {
  id: string;
  attentionId: string;
  /** Client-generated id that makes submitting the same order idempotent. */
  requestId: string;
  source: OrderSource;
  submittedByUserId: string | null;
  submittedByParticipantId: string | null;
  status: StatusRef<OrderStatus>;
  submittedAt: Date;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One order (comanda / ronda) of an attention, sent from the cart (CUSTOMER)
 * or registered by a waiter. An attention has one or more orders; finishing
 * or cancelling one never closes or cancels the attention.
 */
export class Order {
  private constructor(private props: OrderProps) {}

  static submit(params: {
    id: string;
    attentionId: string;
    requestId: string;
    source: OrderSource;
    /** The restaurant's initial order status (canonical SUBMITTED). */
    status: StatusRef<OrderStatus>;
    submittedByUserId?: string | null;
    submittedByParticipantId?: string | null;
  }): Order {
    const now = new Date();
    return new Order({
      id: params.id,
      attentionId: params.attentionId,
      requestId: params.requestId,
      source: params.source,
      submittedByUserId: params.submittedByUserId ?? null,
      submittedByParticipantId: params.submittedByParticipantId ?? null,
      status: params.status,
      submittedAt: now,
      confirmedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: OrderProps): Order {
    return new Order(props);
  }

  confirm(statuses: StatusCatalog<OrderStatus>): void {
    if (this.status !== OrderStatus.SUBMITTED) {
      throw new OrderNotSubmittedError();
    }
    this.props.status = statuses.defaultFor(OrderStatus.CONFIRMED);
    this.props.confirmedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Derives the operational state from the canonical states of its items:
   * every item rejected/cancelled -> CANCELLED; the remaining ones all served
   * -> SERVED, all ready or served -> READY, any started -> IN_PREPARATION;
   * none started -> stays SUBMITTED / CONFIRMED. The status row is the
   * restaurant's first active one for that state.
   */
  syncWithItems(
    itemStates: OrderStatus[],
    statuses: StatusCatalog<OrderStatus>,
  ): void {
    const active = itemStates.filter(
      (state) => !DROPPED_ITEM_STATUSES.includes(state),
    );
    const next = Order.deriveState(active);
    if (next && next !== this.status) {
      this.props.status = statuses.defaultFor(next);
      this.props.updatedAt = new Date();
    }
  }

  /** Cancelling is only possible while nothing of the order has been served. */
  assertCancellable(itemStates: OrderStatus[]): void {
    if (this.isFinished || itemStates.includes(OrderStatus.SERVED)) {
      throw new OrderAlreadyFinishedError(this.status);
    }
  }

  private static deriveState(active: OrderStatus[]): OrderStatus | null {
    if (active.length === 0) {
      return OrderStatus.CANCELLED;
    }
    if (active.every((state) => state === OrderStatus.SERVED)) {
      return OrderStatus.SERVED;
    }
    if (
      active.every(
        (state) => state === OrderStatus.READY || state === OrderStatus.SERVED,
      )
    ) {
      return OrderStatus.READY;
    }
    if (active.some((state) => state !== OrderStatus.SUBMITTED)) {
      return OrderStatus.IN_PREPARATION;
    }
    return null;
  }

  get isFinished(): boolean {
    return FINAL_STATUSES.includes(this.status);
  }

  get id(): string {
    return this.props.id;
  }
  get attentionId(): string {
    return this.props.attentionId;
  }
  get requestId(): string {
    return this.props.requestId;
  }
  get source(): OrderSource {
    return this.props.source;
  }
  get submittedByUserId(): string | null {
    return this.props.submittedByUserId;
  }
  get submittedByParticipantId(): string | null {
    return this.props.submittedByParticipantId;
  }
  /** Canonical state of the current status. */
  get status(): OrderStatus {
    return this.props.status.canonicalState;
  }
  get statusId(): string {
    return this.props.status.id;
  }
  get submittedAt(): Date {
    return this.props.submittedAt;
  }
  get confirmedAt(): Date | null {
    return this.props.confirmedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
