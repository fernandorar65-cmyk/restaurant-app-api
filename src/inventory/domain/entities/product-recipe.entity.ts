import { ValidationDomainError } from '../../../common/domain/domain-error.js';

export interface ProductRecipeProps {
  productId: string;
  supplyId: string;
  quantityRequired: number;
  wastePercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * How much of a master supply one unit of a product consumes. Used to
 * discount stock automatically only when INVENTORY_AUTO_CONSUMPTION is on.
 */
export class ProductRecipe {
  private constructor(private props: ProductRecipeProps) {}

  static create(params: {
    productId: string;
    supplyId: string;
    quantityRequired: number;
    wastePercentage?: number;
  }): ProductRecipe {
    const now = new Date();
    const recipe = new ProductRecipe({
      productId: params.productId,
      supplyId: params.supplyId,
      quantityRequired: 0,
      wastePercentage: 0,
      createdAt: now,
      updatedAt: now,
    });
    recipe.update(params);
    return recipe;
  }

  static fromPersistence(props: ProductRecipeProps): ProductRecipe {
    return new ProductRecipe(props);
  }

  update(params: { quantityRequired?: number; wastePercentage?: number }): void {
    if (params.quantityRequired !== undefined) {
      if (params.quantityRequired <= 0) {
        throw new ValidationDomainError('La cantidad requerida debe ser mayor a 0');
      }
      this.props.quantityRequired = params.quantityRequired;
    }
    if (params.wastePercentage !== undefined) {
      if (params.wastePercentage < 0 || params.wastePercentage > 100) {
        throw new ValidationDomainError('La merma debe estar entre 0 y 100%');
      }
      this.props.wastePercentage = params.wastePercentage;
    }
    this.props.updatedAt = new Date();
  }

  /** Quantity actually consumed per unit, including the expected waste. */
  get effectiveQuantity(): number {
    const value = this.props.quantityRequired * (1 + this.props.wastePercentage / 100);
    return Math.round(value * 1000) / 1000;
  }

  get productId(): string {
    return this.props.productId;
  }
  get supplyId(): string {
    return this.props.supplyId;
  }
  get quantityRequired(): number {
    return this.props.quantityRequired;
  }
  get wastePercentage(): number {
    return this.props.wastePercentage;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
