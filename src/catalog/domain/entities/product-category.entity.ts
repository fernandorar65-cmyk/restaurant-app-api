import { requireText } from '../../../common/domain/value-objects/required-text.js';

export interface ProductCategoryProps {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Menu section of a restaurant (e.g. "Entradas", "Bebidas"). */
export class ProductCategory {
  private constructor(private props: ProductCategoryProps) {}

  static create(params: {
    id: string;
    restaurantId: string;
    name: string;
    description?: string | null;
    sortOrder?: number;
  }): ProductCategory {
    const now = new Date();
    return new ProductCategory({
      id: params.id,
      restaurantId: params.restaurantId,
      name: requireText(params.name, 'El nombre de la categoría', { max: 120 }),
      description: params.description ?? null,
      sortOrder: params.sortOrder ?? 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ProductCategoryProps): ProductCategory {
    return new ProductCategory(props);
  }

  update(params: {
    name?: string;
    description?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }): void {
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre de la categoría', {
        max: 120,
      });
    }
    if (params.description !== undefined) {
      this.props.description = params.description;
    }
    if (params.sortOrder !== undefined) {
      this.props.sortOrder = params.sortOrder;
    }
    if (params.isActive !== undefined) {
      this.props.isActive = params.isActive;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get sortOrder(): number {
    return this.props.sortOrder;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
