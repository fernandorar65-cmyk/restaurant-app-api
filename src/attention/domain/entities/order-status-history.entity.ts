import { OrderStatus } from './order-status.enum.js';

export interface OrderStatusHistoryProps {
  id: string;
  status: OrderStatus;
  notes: string | null;
  orderId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderStatusHistory {
  private constructor(private props: OrderStatusHistoryProps) {}

  static create(params: {
    id: string;
    status: OrderStatus;
    notes?: string;
    orderId: string;
  }): OrderStatusHistory {
    const now = new Date();
    return new OrderStatusHistory({
      id: params.id,
      status: params.status,
      notes: params.notes ?? null,
      orderId: params.orderId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: OrderStatusHistoryProps): OrderStatusHistory {
    return new OrderStatusHistory(props);
  }

  get id(): string {
    return this.props.id;
  }
  get status(): OrderStatus {
    return this.props.status;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
