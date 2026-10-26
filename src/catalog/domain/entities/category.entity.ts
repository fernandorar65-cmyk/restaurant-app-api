import { requireText } from '../../../common/domain/value-objects/required-text.js';
import { CategoryCycleError } from '../exceptions/catalog.errors.js';

export interface CategoryProps {
  id: string;
  organizationId: string;
  parentCategoryId: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reusable product category of an organization (Bebidas, Postres...). It can
 * hang from another one to build a tree: Comidas > Carnes > Parrillas.
 * How a menu groups its products is a MenuSection, not a category.
 */
export class Category {
  private constructor(private props: CategoryProps) {}

  static create(params: {
    id: string;
    organizationId: string;
    parentCategoryId?: string | null;
    name: string;
    description?: string | null;
  }): Category {
    const now = new Date();
    const category = new Category({
      id: params.id,
      organizationId: params.organizationId,
      parentCategoryId: null,
      name: '',
      description: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    category.update(params);
    return category;
  }

  static fromPersistence(props: CategoryProps): Category {
    return new Category(props);
  }

  update(params: {
    parentCategoryId?: string | null;
    name?: string;
    description?: string | null;
    isActive?: boolean;
  }): void {
    if (params.parentCategoryId !== undefined) {
      if (params.parentCategoryId === this.props.id) {
        throw new CategoryCycleError();
      }
      this.props.parentCategoryId = params.parentCategoryId;
    }
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre de la categoría', {
        max: 100,
      });
    }
    if (params.description !== undefined) {
      this.props.description = params.description;
    }
    if (params.isActive !== undefined) {
      this.props.isActive = params.isActive;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get parentCategoryId(): string | null {
    return this.props.parentCategoryId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
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
