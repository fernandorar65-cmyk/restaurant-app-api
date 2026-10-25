import { OrderStatus } from './order-status.enum.js';

export interface OrderProps {
  id: string;
  status: OrderStatus;
  total: number;
  diningTableId: string;
  createdAt: Date;
  updatedAt: Date;
}

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

  update(params: {
    status?: OrderStatus;
    total?: number;
    diningTableId?: string;
  }): void {
    if (params.status) {
      this.props.status = params.status;
    }
    if (params.total !== undefined) {
      this.props.total = params.total;
    }
    if (params.diningTableId) {
      this.props.diningTableId = params.diningTableId;
    }
    this.props.updatedAt = new Date();
  }

  changeStatus(status: OrderStatus): void {
    this.props.status = status;
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
