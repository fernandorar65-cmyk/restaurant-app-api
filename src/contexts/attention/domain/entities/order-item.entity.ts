export interface OrderItemProps {
  id: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  orderId: string;
  productId: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderItem {
  private constructor(private props: OrderItemProps) {}

  static create(params: {
    id: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
    orderId: string;
    productId: string;
    userId?: string;
  }): OrderItem {
    OrderItem.validateQuantity(params.quantity);
    const now = new Date();
    return new OrderItem({
      id: params.id,
      quantity: params.quantity,
      unitPrice: params.unitPrice,
      notes: params.notes ?? null,
      orderId: params.orderId,
      productId: params.productId,
      userId: params.userId ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  private static validateQuantity(quantity: number): void {
    if (quantity < 1) {
      throw new Error('La cantidad debe ser al menos 1');
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
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
