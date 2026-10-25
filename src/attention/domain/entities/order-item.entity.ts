import { randomUUID } from 'node:crypto';
import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { roundMoney } from '../../../common/domain/value-objects/money.js';
import { OrderItemStatus } from '../enums/order-item-status.enum.js';
import {
  InvalidOrderItemTransitionError,
  RejectionReasonRequiredError,
} from '../exceptions/attention.errors.js';
import { OrderItemStatusHistory } from './order-item-status-history.entity.js';

export interface OrderItemProps {
  id: string;
  batchId: string;
  productId: string;
  requestedByParticipantId: string | null;
  /** Name and price are frozen at order time: catalog edits never alter them. */
  productNameSnapshot: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  customerNote: string | null;
  currentStatus: OrderItemStatus;
  rejectionReason: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ALLOWED_TRANSITIONS: Record<OrderItemStatus, OrderItemStatus[]> = {
  [OrderItemStatus.SUBMITTED]: [
    OrderItemStatus.PREPARING,
    OrderItemStatus.REJECTED,
    OrderItemStatus.CANCELLED,
  ],
  [OrderItemStatus.PREPARING]: [OrderItemStatus.READY, OrderItemStatus.CANCELLED],
  [OrderItemStatus.READY]: [OrderItemStatus.DELIVERED, OrderItemStatus.CANCELLED],
  [OrderItemStatus.DELIVERED]: [],
  [OrderItemStatus.REJECTED]: [],
  [OrderItemStatus.CANCELLED]: [],
};

const NON_BILLABLE = [OrderItemStatus.REJECTED, OrderItemStatus.CANCELLED];

export class OrderItem {
  private constructor(private props: OrderItemProps) {}

  /** Returns the item together with its initial history entry. */
  static create(params: {
    id: string;
    batchId: string;
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    customerNote?: string | null;
    requestedByParticipantId?: string | null;
  }): { item: OrderItem; history: OrderItemStatusHistory } {
    if (!Number.isInteger(params.quantity) || params.quantity < 1) {
      throw new ValidationDomainError('La cantidad debe ser un entero mayor a 0');
    }
    const now = new Date();
    const item = new OrderItem({
      id: params.id,
      batchId: params.batchId,
      productId: params.productId,
      requestedByParticipantId: params.requestedByParticipantId ?? null,
      productNameSnapshot: params.productName,
      unitPrice: params.unitPrice,
      quantity: params.quantity,
      subtotal: roundMoney(params.unitPrice * params.quantity),
      customerNote: params.customerNote ?? null,
      currentStatus: OrderItemStatus.SUBMITTED,
      rejectionReason: null,
      version: 0,
      createdAt: now,
      updatedAt: now,
    });
    const history = OrderItemStatusHistory.record({
      id: randomUUID(),
      orderItemId: item.id,
      previousStatus: null,
      newStatus: OrderItemStatus.SUBMITTED,
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
   * SUBMITTED -> DELIVERED). Returns the history entry to persist with it.
   */
  changeStatus(
    target: OrderItemStatus,
    options: { reason?: string | null; changedByUserId?: string | null } = {},
  ): OrderItemStatusHistory {
    const previous = this.props.currentStatus;
    if (!ALLOWED_TRANSITIONS[previous].includes(target)) {
      throw new InvalidOrderItemTransitionError(previous, target);
    }
    const reason = options.reason?.trim() || null;
    if (target === OrderItemStatus.REJECTED && !reason) {
      throw new RejectionReasonRequiredError();
    }
    const versionBefore = this.props.version;
    this.props.currentStatus = target;
    if (target === OrderItemStatus.REJECTED) {
      this.props.rejectionReason = reason;
    }
    this.props.updatedAt = new Date();
    return OrderItemStatusHistory.record({
      id: randomUUID(),
      orderItemId: this.props.id,
      previousStatus: previous,
      newStatus: target,
      changedByUserId: options.changedByUserId ?? null,
      reason,
      versionBefore,
    });
  }

  get isBillable(): boolean {
    return !NON_BILLABLE.includes(this.props.currentStatus);
  }

  get id(): string {
    return this.props.id;
  }
  get batchId(): string {
    return this.props.batchId;
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
  get currentStatus(): OrderItemStatus {
    return this.props.currentStatus;
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
