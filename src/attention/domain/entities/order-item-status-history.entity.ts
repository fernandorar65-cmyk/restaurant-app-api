import { OrderItemStatus } from '../enums/order-item-status.enum.js';

export interface OrderItemStatusHistoryProps {
  id: string;
  orderItemId: string;
  previousStatus: OrderItemStatus | null;
  newStatus: OrderItemStatus;
  changedByUserId: string | null;
  reason: string | null;
  changedAt: Date;
  versionBefore: number | null;
}

/** Audit entry written for every status an order item goes through. */
export class OrderItemStatusHistory {
  private constructor(private readonly props: OrderItemStatusHistoryProps) {}

  static record(
    props: Omit<OrderItemStatusHistoryProps, 'changedAt'>,
  ): OrderItemStatusHistory {
    return new OrderItemStatusHistory({ ...props, changedAt: new Date() });
  }

  static fromPersistence(props: OrderItemStatusHistoryProps): OrderItemStatusHistory {
    return new OrderItemStatusHistory(props);
  }

  get id(): string {
    return this.props.id;
  }
  get orderItemId(): string {
    return this.props.orderItemId;
  }
  get previousStatus(): OrderItemStatus | null {
    return this.props.previousStatus;
  }
  get newStatus(): OrderItemStatus {
    return this.props.newStatus;
  }
  get changedByUserId(): string | null {
    return this.props.changedByUserId;
  }
  get reason(): string | null {
    return this.props.reason;
  }
  get changedAt(): Date {
    return this.props.changedAt;
  }
  get versionBefore(): number | null {
    return this.props.versionBefore;
  }
}
