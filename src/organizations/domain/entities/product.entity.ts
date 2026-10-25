import { ValidationDomainError } from '../../../common/domain/domain-error.js';

export interface ProductProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  private constructor(private props: ProductProps) {}

  static create(params: {
    id: string;
    name: string;
    description?: string;
    price: number;
    available?: boolean;
    categoryId: string;
  }): Product {
    Product.validateName(params.name);
    Product.validatePrice(params.price);
    const now = new Date();
    return new Product({
      id: params.id,
      name: params.name,
      description: params.description ?? null,
      price: params.price,
      available: params.available ?? true,
      categoryId: params.categoryId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  private static validateName(name: string): void {
    if (name.trim().length < 2) {
      throw new ValidationDomainError('El nombre del producto debe tener al menos 2 caracteres');
    }
  }

  private static validatePrice(price: number): void {
    if (price < 0) {
      throw new ValidationDomainError('El precio del producto no puede ser negativo');
    }
  }

  update(params: {
    name?: string;
    description?: string;
    price?: number;
    available?: boolean;
    categoryId?: string;
  }): void {
    if (params.name) {
      Product.validateName(params.name);
      this.props.name = params.name;
    }
    if (params.description !== undefined) {
      this.props.description = params.description;
    }
    if (params.price !== undefined) {
      Product.validatePrice(params.price);
      this.props.price = params.price;
    }
    if (params.available !== undefined) {
      this.props.available = params.available;
    }
    if (params.categoryId) {
      this.props.categoryId = params.categoryId;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get price(): number {
    return this.props.price;
  }
  get available(): boolean {
    return this.props.available;
  }
  get categoryId(): string {
    return this.props.categoryId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
