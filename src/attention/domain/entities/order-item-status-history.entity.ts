import type { OrderStatus } from '../enums/order-status.enum.js';
import type { StatusRef } from '../workflows.js';

export interface OrderItemStatusHistoryProps {
  id: string;
  orderItemId: string;
  previousStatus: StatusRef<OrderStatus> | null;
  newStatus: StatusRef<OrderStatus>;
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

  static fromPersistence(
    props: OrderItemStatusHistoryProps,
  ): OrderItemStatusHistory {
    return new OrderItemStatusHistory(props);
  }

  get id(): string {
    return this.props.id;
  }
  get orderItemId(): string {
    return this.props.orderItemId;
  }
  get previousStatus(): StatusRef<OrderStatus> | null {
    return this.props.previousStatus;
  }
  get newStatus(): StatusRef<OrderStatus> {
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
