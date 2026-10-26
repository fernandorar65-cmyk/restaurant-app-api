import { requireText } from '../../../common/domain/value-objects/required-text.js';

export interface ProductIngredientProps {
  id: string;
  productId: string;
  name: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ingredient shown to diners on the menu. Not linked to inventory: stock
 * consumption is modelled by inventory's product recipes.
 */
export class ProductIngredient {
  private constructor(private props: ProductIngredientProps) {}

  static create(params: {
    id: string;
    productId: string;
    name: string;
    sortOrder?: number;
    isVisible?: boolean;
  }): ProductIngredient {
    const now = new Date();
    return new ProductIngredient({
      id: params.id,
      productId: params.productId,
      name: requireText(params.name, 'El nombre del ingrediente', { max: 150 }),
      sortOrder: params.sortOrder ?? 0,
      isVisible: params.isVisible ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ProductIngredientProps): ProductIngredient {
    return new ProductIngredient(props);
  }

  update(params: { name?: string; sortOrder?: number; isVisible?: boolean }): void {
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre del ingrediente', {
        max: 150,
      });
    }
    if (params.sortOrder !== undefined) {
      this.props.sortOrder = params.sortOrder;
    }
    if (params.isVisible !== undefined) {
      this.props.isVisible = params.isVisible;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get productId(): string {
    return this.props.productId;
  }
  get name(): string {
    return this.props.name;
  }
  get sortOrder(): number {
    return this.props.sortOrder;
  }
  get isVisible(): boolean {
    return this.props.isVisible;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
