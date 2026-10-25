import { ValidationDomainError } from '../../../common/domain/domain-error.js';

export interface OrderItemProps {
  id: string;
  quantity: number;
  unitPrice: number;
  productName: string;
  notes: string | null;
  orderId: string;
  productId: string;
  userId: string | null;
  customerId: string | null;
  roundNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderItem {
  private constructor(private props: OrderItemProps) {}

  static create(params: {
    id: string;
    quantity: number;
    unitPrice: number;
    productName: string;
    notes?: string;
    orderId: string;
    productId: string;
    userId?: string;
    customerId?: string;
    roundNumber?: number;
  }): OrderItem {
    OrderItem.validateQuantity(params.quantity);
    const now = new Date();
    return new OrderItem({
      id: params.id,
      quantity: params.quantity,
      unitPrice: params.unitPrice,
      productName: params.productName,
      notes: params.notes ?? null,
      orderId: params.orderId,
      productId: params.productId,
      userId: params.userId ?? null,
      customerId: params.customerId ?? null,
      roundNumber: params.roundNumber ?? 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  private static validateQuantity(quantity: number): void {
    if (quantity < 1) {
      throw new ValidationDomainError('La cantidad debe ser al menos 1');
    }
  }

  update(params: { quantity?: number; notes?: string }): void {
    if (params.quantity !== undefined) {
      OrderItem.validateQuantity(params.quantity);
      this.props.quantity = params.quantity;
    }
    if (params.notes !== undefined) {
      this.props.notes = params.notes;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get unitPrice(): number {
    return this.props.unitPrice;
  }
  get productName(): string {
    return this.props.productName;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get productId(): string {
    return this.props.productId;
  }
  get userId(): string | null {
    return this.props.userId;
  }
  get customerId(): string | null {
    return this.props.customerId;
  }
  get roundNumber(): number {
    return this.props.roundNumber;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
