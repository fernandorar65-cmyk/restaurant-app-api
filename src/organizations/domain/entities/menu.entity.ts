import { ValidationDomainError } from '../../../common/domain/domain-error.js';

export interface MenuProps {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Menu {
  private constructor(private props: MenuProps) {}

  static create(params: {
    id: string;
    name: string;
    description?: string;
    active?: boolean;
    restaurantId: string;
  }): Menu {
    Menu.validateName(params.name);
    const now = new Date();
    return new Menu({
      id: params.id,
      name: params.name,
      description: params.description ?? null,
      active: params.active ?? true,
      restaurantId: params.restaurantId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: MenuProps): Menu {
    return new Menu(props);
  }

  private static validateName(name: string): void {
    if (name.trim().length < 2) {
      throw new ValidationDomainError('El nombre del menú debe tener al menos 2 caracteres');
    }
  }

  update(params: {
    name?: string;
    description?: string;
    active?: boolean;
    restaurantId?: string;
  }): void {
    if (params.name) {
      Menu.validateName(params.name);
      this.props.name = params.name;
    }
    if (params.description !== undefined) {
      this.props.description = params.description;
    }
    if (params.active !== undefined) {
      this.props.active = params.active;
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
  get description(): string | null {
    return this.props.description;
  }
  get active(): boolean {
    return this.props.active;
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
