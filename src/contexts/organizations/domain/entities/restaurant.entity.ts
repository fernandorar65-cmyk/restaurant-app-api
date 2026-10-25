export interface RestaurantProps {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Restaurant {
  private constructor(private props: RestaurantProps) {}

  static create(params: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    organizationId: string;
  }): Restaurant {
    Restaurant.validateName(params.name);
    const now = new Date();
    return new Restaurant({
      id: params.id,
      name: params.name,
      address: params.address ?? null,
      phone: params.phone ?? null,
      organizationId: params.organizationId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: RestaurantProps): Restaurant {
    return new Restaurant(props);
  }

  private static validateName(name: string): void {
    if (name.trim().length < 2) {
      throw new Error('El nombre del restaurante debe tener al menos 2 caracteres');
    }
  }

  update(params: {
    name?: string;
    address?: string;
    phone?: string;
    organizationId?: string;
  }): void {
    if (params.name) {
      Restaurant.validateName(params.name);
      this.props.name = params.name;
    }
    if (params.address !== undefined) {
      this.props.address = params.address;
    }
    if (params.phone !== undefined) {
      this.props.phone = params.phone;
    }
    if (params.organizationId) {
      this.props.organizationId = params.organizationId;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get address(): string | null {
    return this.props.address;
  }
  get phone(): string | null {
    return this.props.phone;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
