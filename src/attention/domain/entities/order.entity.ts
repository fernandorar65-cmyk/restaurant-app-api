import { OrderItemStatus } from '../enums/order-item-status.enum.js';
import { OrderSource } from '../enums/order-source.enum.js';
import { OrderStatus } from '../enums/order-status.enum.js';
import {
  OrderAlreadyFinishedError,
  OrderNotSubmittedError,
} from '../exceptions/attention.errors.js';

const DROPPED_ITEM_STATUSES = [OrderItemStatus.REJECTED, OrderItemStatus.CANCELLED];
const FINAL_STATUSES = [OrderStatus.SERVED, OrderStatus.CANCELLED];

export interface OrderProps {
  id: string;
  attentionId: string;
  /** Client-generated id that makes submitting the same order idempotent. */
  requestId: string;
  source: OrderSource;
  submittedByUserId: string | null;
  submittedByParticipantId: string | null;
  status: OrderStatus;
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
      status: OrderStatus.SUBMITTED,
      submittedAt: now,
      confirmedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: OrderProps): Order {
    return new Order(props);
  }

  confirm(): void {
    if (this.props.status !== OrderStatus.SUBMITTED) {
      throw new OrderNotSubmittedError();
    }
    this.props.status = OrderStatus.CONFIRMED;
    this.props.confirmedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Derives the operational status from the statuses of its items:
   * every item rejected/cancelled -> CANCELLED; the remaining ones all
   * delivered -> SERVED, all ready or delivered -> READY, any started ->
   * PREPARING; none started -> stays SUBMITTED / CONFIRMED.
   */
  syncWithItems(itemStatuses: OrderItemStatus[]): void {
    const active = itemStatuses.filter((status) => !DROPPED_ITEM_STATUSES.includes(status));
    const next = Order.deriveStatus(active);
    if (next && next !== this.props.status) {
      this.props.status = next;
      this.props.updatedAt = new Date();
    }
  }

  /** Cancelling is only possible while nothing of the order has been served. */
  assertCancellable(itemStatuses: OrderItemStatus[]): void {
    if (this.isFinished || itemStatuses.includes(OrderItemStatus.DELIVERED)) {
      throw new OrderAlreadyFinishedError(this.props.status);
    }
  }

  private static deriveStatus(active: OrderItemStatus[]): OrderStatus | null {
    if (active.length === 0) {
      return OrderStatus.CANCELLED;
    }
    if (active.every((status) => status === OrderItemStatus.DELIVERED)) {
      return OrderStatus.SERVED;
    }
    if (
      active.every(
        (status) => status === OrderItemStatus.READY || status === OrderItemStatus.DELIVERED,
      )
    ) {
      return OrderStatus.READY;
    }
    if (active.some((status) => status !== OrderItemStatus.SUBMITTED)) {
      return OrderStatus.PREPARING;
    }
    return null;
  }

  get isFinished(): boolean {
    return FINAL_STATUSES.includes(this.props.status);
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
  get status(): OrderStatus {
    return this.props.status;
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
