import { InvalidOrderStatusTransitionError } from '../exceptions/order.errors.js';
import { OrderStatus } from './order-status.enum.js';

export interface OrderProps {
  id: string;
  status: OrderStatus;
  total: number;
  diningTableId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderLineSnapshot {
  quantity: number;
  unitPrice: number;
}

const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.OPEN]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.SERVED, OrderStatus.CANCELLED],
  [OrderStatus.SERVED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [],
  [OrderStatus.CANCELLED]: [],
};

export class Order {
  private constructor(private props: OrderProps) {}

  static create(params: {
    id: string;
    diningTableId: string;
    status?: OrderStatus;
  }): Order {
    const now = new Date();
    return new Order({
      id: params.id,
      status: params.status ?? OrderStatus.OPEN,
      total: 0,
      diningTableId: params.diningTableId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: OrderProps): Order {
    return new Order(props);
  }

  changeDiningTable(diningTableId: string): void {
    this.props.diningTableId = diningTableId;
    this.props.updatedAt = new Date();
  }

  changeStatus(status: OrderStatus): void {
    if (status === this.props.status) {
      return;
    }
    const allowedTargets = ALLOWED_STATUS_TRANSITIONS[this.props.status];
    if (!allowedTargets.includes(status)) {
      throw new InvalidOrderStatusTransitionError(this.props.status, status);
    }
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  recalculateTotal(lines: OrderLineSnapshot[]): void {
    this.props.total = lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0,
    );
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get status(): OrderStatus {
    return this.props.status;
  }
  get total(): number {
    return this.props.total;
  }
  get diningTableId(): string {
    return this.props.diningTableId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
