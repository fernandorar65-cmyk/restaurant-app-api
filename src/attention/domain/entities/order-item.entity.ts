import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { roundMoney } from '../../../common/domain/value-objects/money.js';
import { OrderStatus } from '../enums/order-status.enum.js';
import type { StatusRef } from '../workflows.js';
import {
  InvalidOrderItemTransitionError,
  RejectionReasonRequiredError,
} from '../exceptions/attention.errors.js';
import { OrderItemStatusHistory } from './order-item-status-history.entity.js';

export interface OrderItemProps {
  id: string;
  orderId: string;
  productId: string;
  requestedByParticipantId: string | null;
  /** Name and price are frozen at order time: catalog edits never alter them. */
  productNameSnapshot: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  customerNote: string | null;
  status: StatusRef<OrderStatus>;
  rejectionReason: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Kitchen flow between canonical states; CONFIRMED only applies to orders. */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.SUBMITTED]: [
    OrderStatus.IN_PREPARATION,
    OrderStatus.REJECTED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.CONFIRMED]: [],
  [OrderStatus.IN_PREPARATION]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.SERVED, OrderStatus.CANCELLED],
  [OrderStatus.SERVED]: [],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.CANCELLED]: [],
};

const FINAL_STATES = [
  OrderStatus.SERVED,
  OrderStatus.REJECTED,
  OrderStatus.CANCELLED,
];
const NON_BILLABLE = [OrderStatus.REJECTED, OrderStatus.CANCELLED];

export class OrderItem {
  private constructor(private props: OrderItemProps) {}

  /** Returns the item together with its initial history entry. */
  static create(params: {
    id: string;
    /** Id for the initial history entry. */
    historyId: string;
    /** The restaurant's initial order status (canonical SUBMITTED). */
    status: StatusRef<OrderStatus>;
    orderId: string;
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    customerNote?: string | null;
    requestedByParticipantId?: string | null;
  }): { item: OrderItem; history: OrderItemStatusHistory } {
    if (!Number.isInteger(params.quantity) || params.quantity < 1) {
      throw new ValidationDomainError(
        'La cantidad debe ser un entero mayor a 0',
      );
    }
    const now = new Date();
    const item = new OrderItem({
      id: params.id,
      orderId: params.orderId,
      productId: params.productId,
      requestedByParticipantId: params.requestedByParticipantId ?? null,
      productNameSnapshot: params.productName,
      unitPrice: params.unitPrice,
      quantity: params.quantity,
      subtotal: roundMoney(params.unitPrice * params.quantity),
      customerNote: params.customerNote ?? null,
      status: params.status,
      rejectionReason: null,
      version: 0,
      createdAt: now,
      updatedAt: now,
    });
    const history = OrderItemStatusHistory.record({
      id: params.historyId,
      orderItemId: item.id,
      previousStatus: null,
      newStatus: params.status,
      changedByUserId: null,
      reason: null,
      versionBefore: null,
    });
    return { item, history };
  }

  static fromPersistence(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  /**
   * Moves the item along the kitchen flow, rejecting arbitrary jumps (e.g.
   * SUBMITTED -> SERVED). Within a non-final state the item may also move
   * between the restaurant's own statuses (e.g. "En horno" -> "Emplatado").
   * Returns the history entry to persist with it.
   */
  changeStatus(
    target: StatusRef<OrderStatus>,
    options: {
      historyId: string;
      reason?: string | null;
      changedByUserId?: string | null;
    },
  ): OrderItemStatusHistory {
    const previous = this.props.status;
    const from = previous.canonicalState;
    const to = target.canonicalState;
    const sameStateMove =
      from === to && previous.id !== target.id && !FINAL_STATES.includes(from);
    if (!sameStateMove && !ALLOWED_TRANSITIONS[from].includes(to)) {
      throw new InvalidOrderItemTransitionError(from, to);
    }
    const reason = options.reason?.trim() || null;
    if (to === OrderStatus.REJECTED && !reason) {
      throw new RejectionReasonRequiredError();
    }
    const versionBefore = this.props.version;
    this.props.status = target;
    if (to === OrderStatus.REJECTED) {
      this.props.rejectionReason = reason;
    }
    this.props.updatedAt = new Date();
    return OrderItemStatusHistory.record({
      id: options.historyId,
      orderItemId: this.props.id,
      previousStatus: previous,
      newStatus: target,
      changedByUserId: options.changedByUserId ?? null,
      reason,
      versionBefore,
    });
  }

  get isBillable(): boolean {
    return !NON_BILLABLE.includes(this.currentStatus);
  }

  get id(): string {
    return this.props.id;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get productId(): string {
    return this.props.productId;
  }
  get requestedByParticipantId(): string | null {
    return this.props.requestedByParticipantId;
  }
  get productNameSnapshot(): string {
    return this.props.productNameSnapshot;
  }
  get unitPrice(): number {
    return this.props.unitPrice;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get subtotal(): number {
    return this.props.subtotal;
  }
  get customerNote(): string | null {
    return this.props.customerNote;
  }
  /** Canonical state of the current status. */
  get currentStatus(): OrderStatus {
    return this.props.status.canonicalState;
  }
  get statusId(): string {
    return this.props.status.id;
  }
  get rejectionReason(): string | null {
    return this.props.rejectionReason;
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
