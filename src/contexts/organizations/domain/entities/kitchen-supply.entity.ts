export interface KitchenSupplyProps {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class KitchenSupply {
  private constructor(private props: KitchenSupplyProps) {}

  static create(params: {
    id: string;
    name: string;
    unit: string;
    quantity?: number;
    restaurantId: string;
  }): KitchenSupply {
    KitchenSupply.validateName(params.name);
    const now = new Date();
    return new KitchenSupply({
      id: params.id,
      name: params.name,
      unit: params.unit,
      quantity: params.quantity ?? 0,
      restaurantId: params.restaurantId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: KitchenSupplyProps): KitchenSupply {
    return new KitchenSupply(props);
  }

  private static validateName(name: string): void {
    if (name.trim().length < 2) {
      throw new Error('El nombre del insumo debe tener al menos 2 caracteres');
    }
  }

  update(params: {
    name?: string;
    unit?: string;
    quantity?: number;
    restaurantId?: string;
  }): void {
    if (params.name) {
      KitchenSupply.validateName(params.name);
      this.props.name = params.name;
    }
    if (params.unit) {
      this.props.unit = params.unit;
    }
    if (params.quantity !== undefined) {
      this.props.quantity = params.quantity;
    }
    if (params.restaurantId) {
      this.props.restaurantId = params.restaurantId;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get unit(): string {
    return this.props.unit;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
