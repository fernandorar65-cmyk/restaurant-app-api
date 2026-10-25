import { ValidationDomainError } from '../../../common/domain/domain-error.js';

export interface CategoryProps {
  id: string;
  name: string;
  description: string | null;
  menuId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Category {
  private constructor(private props: CategoryProps) {}

  static create(params: {
    id: string;
    name: string;
    description?: string;
    menuId: string;
  }): Category {
    Category.validateName(params.name);
    const now = new Date();
    return new Category({
      id: params.id,
      name: params.name,
      description: params.description ?? null,
      menuId: params.menuId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: CategoryProps): Category {
    return new Category(props);
  }

  private static validateName(name: string): void {
    if (name.trim().length < 2) {
      throw new ValidationDomainError('El nombre de la categoría debe tener al menos 2 caracteres');
    }
  }

  update(params: { name?: string; description?: string; menuId?: string }): void {
    if (params.name) {
      Category.validateName(params.name);
      this.props.name = params.name;
    }
    if (params.description !== undefined) {
      this.props.description = params.description;
    }
    if (params.menuId) {
      this.props.menuId = params.menuId;
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
  get menuId(): string {
    return this.props.menuId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
