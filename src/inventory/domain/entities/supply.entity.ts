import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import { InventoryMovementType } from '../enums/inventory-movement-type.enum.js';
import {
  InsufficientStockError,
  NoStockDifferenceError,
} from '../exceptions/inventory.errors.js';
import { InventoryMovement } from './inventory-movement.entity.js';

export interface SupplyProps {
  id: string;
  restaurantId: string;
  categoryId: string;
  code: string;
  name: string;
  unitOfMeasure: string;
  minimumQuantity: number;
  currentQuantity: number;
  averageUnitCost: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplyDetails {
  code?: string;
  name?: string;
  unitOfMeasure?: string;
  minimumQuantity?: number;
}

export type AdjustmentDirection = 'INCREASE' | 'DECREASE';

export type MovementRequest = {
  id: string;
  notes?: string | null;
  createdByUserId?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
} & (
  | { type: InventoryMovementType.PURCHASE; quantity: number; unitCost?: number | null }
  | { type: InventoryMovementType.USAGE | InventoryMovementType.WASTE; quantity: number }
  /** Physical count: the counted quantity replaces the current one. */
  | { type: InventoryMovementType.COUNT; countedQuantity: number }
  | {
      type: InventoryMovementType.ADJUSTMENT;
      quantity: number;
      direction: AdjustmentDirection;
    }
);

const QUANTITY_DECIMALS = 1000; // NUMERIC(14,3)
const COST_DECIMALS = 10000; // NUMERIC(14,4)

/**
 * A kitchen supply with its stock. current_quantity never changes directly:
 * every change goes through registerMovement, which returns the movement
 * that must be persisted in the same transaction.
 */
export class Supply {
  private constructor(private props: SupplyProps) {}

  static create(
    params: SupplyDetails & {
      id: string;
      restaurantId: string;
      categoryId: string;
      code: string;
      name: string;
      unitOfMeasure: string;
    },
  ): Supply {
    const now = new Date();
    const supply = new Supply({
      id: params.id,
      restaurantId: params.restaurantId,
      categoryId: params.categoryId,
      code: '',
      name: '',
      unitOfMeasure: '',
      minimumQuantity: 0,
      currentQuantity: 0,
      averageUnitCost: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    supply.applyDetails(params);
    return supply;
  }

  static fromPersistence(props: SupplyProps): Supply {
    return new Supply(props);
  }

  update(
    params: SupplyDetails & { categoryId?: string; isActive?: boolean },
  ): void {
    this.applyDetails(params);
    if (params.categoryId !== undefined) {
      this.props.categoryId = params.categoryId;
    }
    if (params.isActive !== undefined) {
      this.props.isActive = params.isActive;
    }
    this.props.updatedAt = new Date();
  }

  registerMovement(request: MovementRequest): InventoryMovement {
    const previous = this.props.currentQuantity;
    let quantity: number;
    let resulting: number;
    let unitCost: number | null = null;

    switch (request.type) {
      case InventoryMovementType.PURCHASE:
        quantity = positive(request.quantity);
        resulting = previous + quantity;
        unitCost = request.unitCost ?? null;
        if (unitCost !== null) {
          this.props.averageUnitCost = round(
            (previous * this.props.averageUnitCost + quantity * unitCost) /
              resulting,
            COST_DECIMALS,
          );
        }
        break;
      case InventoryMovementType.USAGE:
      case InventoryMovementType.WASTE:
        quantity = positive(request.quantity);
        resulting = previous - quantity;
        break;
      case InventoryMovementType.ADJUSTMENT:
        quantity = positive(request.quantity);
        resulting =
          request.direction === 'INCREASE' ? previous + quantity : previous - quantity;
        break;
      case InventoryMovementType.COUNT:
        if (request.countedQuantity < 0) {
          throw new ValidationDomainError('La cantidad contada no puede ser negativa');
        }
        resulting = request.countedQuantity;
        quantity = Math.abs(resulting - previous);
        if (quantity === 0) {
          throw new NoStockDifferenceError();
        }
        break;
    }

    resulting = round(resulting, QUANTITY_DECIMALS);
    if (resulting < 0) {
      throw new InsufficientStockError(this.props.name, previous);
    }
    this.props.currentQuantity = resulting;
    this.props.updatedAt = new Date();

    return InventoryMovement.record({
      id: request.id,
      supplyId: this.props.id,
      movementType: request.type,
      quantity: round(quantity, QUANTITY_DECIMALS),
      unitCost,
      previousQuantity: previous,
      resultingQuantity: resulting,
      referenceType: request.referenceType ?? null,
      referenceId: request.referenceId ?? null,
      notes: request.notes ?? null,
      createdByUserId: request.createdByUserId ?? null,
    });
  }

  get isBelowMinimum(): boolean {
    return this.props.currentQuantity < this.props.minimumQuantity;
  }

  private applyDetails(params: SupplyDetails): void {
    if (params.code !== undefined) {
      this.props.code = requireText(params.code, 'El código del insumo', { max: 50 });
    }
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre del insumo', {
        max: 150,
      });
    }
    if (params.unitOfMeasure !== undefined) {
      this.props.unitOfMeasure = requireText(
        params.unitOfMeasure,
        'La unidad de medida',
        { max: 30 },
      );
    }
    if (params.minimumQuantity !== undefined) {
      if (params.minimumQuantity < 0) {
        throw new ValidationDomainError('El stock mínimo no puede ser negativo');
      }
      this.props.minimumQuantity = params.minimumQuantity;
    }
  }

  get id(): string {
    return this.props.id;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
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
  get unitOfMeasure(): string {
    return this.props.unitOfMeasure;
  }
  get minimumQuantity(): number {
    return this.props.minimumQuantity;
  }
  get currentQuantity(): number {
    return this.props.currentQuantity;
  }
  get averageUnitCost(): number {
    return this.props.averageUnitCost;
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

function positive(quantity: number): number {
  if (quantity <= 0) {
    throw new ValidationDomainError('La cantidad del movimiento debe ser mayor a 0');
  }
  return quantity;
}

function round(value: number, factor: number): number {
  return Math.round(value * factor) / factor;
}
