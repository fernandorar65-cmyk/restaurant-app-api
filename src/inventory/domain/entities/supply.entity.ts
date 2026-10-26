import { requireText } from '../../../common/domain/value-objects/required-text.js';

export interface SupplyProps {
  id: string;
  organizationId: string;
  categoryId: string;
  code: string;
  name: string;
  /** Code of the base unit (units_of_measure): bought, used and counted in it. */
  unitCode: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplyDetails {
  code?: string;
  name?: string;
  description?: string | null;
}

/**
 * Master definition of a supply, registered once per organization ("Arroz",
 * "Aceite vegetal"). It holds no stock: quantities, minimums and costs live
 * per restaurant in RestaurantSupply.
 */
export class Supply {
  private constructor(private props: SupplyProps) {}

  static create(
    params: SupplyDetails & {
      id: string;
      organizationId: string;
      categoryId: string;
      code: string;
      name: string;
      unitCode: string;
    },
  ): Supply {
    const now = new Date();
    const supply = new Supply({
      id: params.id,
      organizationId: params.organizationId,
      categoryId: params.categoryId,
      code: '',
      name: '',
      unitCode: params.unitCode,
      description: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    supply.update(params);
    return supply;
  }

  static fromPersistence(props: SupplyProps): Supply {
    return new Supply(props);
  }

  /** The unit is changed only through changeUnit, after checking it has no movements. */
  update(params: SupplyDetails & { categoryId?: string; isActive?: boolean }): void {
    if (params.code !== undefined) {
      this.props.code = requireText(params.code, 'El código del insumo', { max: 50 }).toUpperCase();
    }
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre del insumo', { max: 150 });
    }
    if (params.description !== undefined) {
      this.props.description = params.description;
    }
    if (params.categoryId !== undefined) {
      this.props.categoryId = params.categoryId;
    }
    if (params.isActive !== undefined) {
      this.props.isActive = params.isActive;
    }
    this.props.updatedAt = new Date();
  }

  changeUnit(unitCode: string): void {
    this.props.unitCode = unitCode;
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get categoryId(): string {
    return this.props.categoryId;
  }
  get code(): string {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get unitCode(): string {
    return this.props.unitCode;
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
