import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import { MenuStatus } from '../enums/menu-status.enum.js';

export interface MenuProps {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  status: MenuStatus;
  validFrom: Date | null;
  validUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuDetails {
  name?: string;
  description?: string | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
}

/** A named selection of products (e.g. "Carta", "Menú del día"). */
export class Menu {
  private constructor(private props: MenuProps) {}

  static create(
    params: MenuDetails & { id: string; restaurantId: string; name: string },
  ): Menu {
    const now = new Date();
    const menu = new Menu({
      id: params.id,
      restaurantId: params.restaurantId,
      name: '',
      description: null,
      status: MenuStatus.DRAFT,
      validFrom: null,
      validUntil: null,
      createdAt: now,
      updatedAt: now,
    });
    menu.applyDetails(params);
    return menu;
  }

  static fromPersistence(props: MenuProps): Menu {
    return new Menu(props);
  }

  update(params: MenuDetails & { status?: MenuStatus }): void {
    this.applyDetails(params);
    if (params.status !== undefined) {
      this.props.status = params.status;
    }
    this.props.updatedAt = new Date();
  }

  private applyDetails(params: MenuDetails): void {
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre del menú', {
        max: 150,
      });
    }
    if (params.description !== undefined) {
      this.props.description = params.description;
    }
    if (params.validFrom !== undefined) {
      this.props.validFrom = params.validFrom;
    }
    if (params.validUntil !== undefined) {
      this.props.validUntil = params.validUntil;
    }
    const { validFrom, validUntil } = this.props;
    if (validFrom && validUntil && validUntil < validFrom) {
      throw new ValidationDomainError(
        'La vigencia del menú no puede terminar antes de empezar',
      );
    }
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
  get status(): MenuStatus {
    return this.props.status;
  }
  get validFrom(): Date | null {
    return this.props.validFrom;
  }
  get validUntil(): Date | null {
    return this.props.validUntil;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
