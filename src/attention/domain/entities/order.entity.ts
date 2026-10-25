import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { InvalidOrderStatusTransitionError } from '../exceptions/order.errors.js';
import { FulfillmentType } from './fulfillment-type.enum.js';
import { OrderStatus } from './order-status.enum.js';

export interface OrderProps {
  id: string;
  code: string;
  status: OrderStatus;
  total: number;
  fulfillmentType: FulfillmentType;
  diningTableId: string | null;
  deliveryAddress: string | null;
  customerId: string | null;
  guestToken: string | null;
  billRequestedAt: Date | null;
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
    fulfillmentType: FulfillmentType;
    diningTableId?: string;
    deliveryAddress?: string;
    customerId?: string;
    guestToken?: string;
    status?: OrderStatus;
  }): Order {
    Order.validateFulfillmentRequirements(
      params.fulfillmentType,
      params.diningTableId,
      params.deliveryAddress,
    );
    const now = new Date();
    return new Order({
      id: params.id,
      code: generateOrderCode(),
      status: params.status ?? OrderStatus.OPEN,
      total: 0,
      fulfillmentType: params.fulfillmentType,
      diningTableId: params.diningTableId ?? null,
      deliveryAddress: params.deliveryAddress ?? null,
      customerId: params.customerId ?? null,
      guestToken: params.guestToken ?? null,
      billRequestedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: OrderProps): Order {
    return new Order(props);
  }

  private static validateFulfillmentRequirements(
    fulfillmentType: FulfillmentType,
    diningTableId?: string,
    deliveryAddress?: string,
  ): void {
    if (fulfillmentType === FulfillmentType.DINE_IN && !diningTableId) {
      throw new ValidationDomainError('dine_in requiere diningTableId');
    }
    if (fulfillmentType === FulfillmentType.DELIVERY && !deliveryAddress) {
      throw new ValidationDomainError('delivery requiere deliveryAddress');
    }
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

  requestBill(): void {
    this.props.billRequestedAt = new Date();
    this.props.updatedAt = new Date();
  }

  isOwnedBy(params: { customerId?: string; guestToken?: string }): boolean {
    if (params.customerId && this.props.customerId === params.customerId) {
      return true;
    }
    if (params.guestToken && this.props.guestToken === params.guestToken) {
      return true;
    }
    return false;
  }

  get id(): string {
    return this.props.id;
  }
  get code(): string {
    return this.props.code;
  }
  get status(): OrderStatus {
    return this.props.status;
  }
  get total(): number {
    return this.props.total;
  }
  get fulfillmentType(): FulfillmentType {
    return this.props.fulfillmentType;
  }
  get diningTableId(): string | null {
    return this.props.diningTableId;
  }
  get deliveryAddress(): string | null {
    return this.props.deliveryAddress;
  }
  get customerId(): string | null {
    return this.props.customerId;
  }
  get guestToken(): string | null {
    return this.props.guestToken;
  }
  get billRequestedAt(): Date | null {
    return this.props.billRequestedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

function generateOrderCode(): string {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${letter}-${digits}`;
}
