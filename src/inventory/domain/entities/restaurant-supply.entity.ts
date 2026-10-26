import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { MovementEffect } from '../enums/movement-effect.enum.js';
import { MovementTypeCode } from '../enums/movement-type-code.enum.js';
import type { ManualMovementType } from '../enums/movement-type-code.enum.js';
import {
  InsufficientStockError,
  InvalidMovementQuantityError,
  ReversalNotReversibleError,
} from '../exceptions/inventory.errors.js';
import { movementEffect } from '../inventory-catalog.js';
import { InventoryMovement } from './inventory-movement.entity.js';
import type { MovementOrigin } from './inventory-movement.entity.js';

export interface RestaurantSupplyProps {
  id: string;
  restaurantId: string;
  supplyId: string;
  /** Quick-read balance; always equals the resulting quantity of the last movement. */
  currentQuantity: number;
  minimumQuantity: number;
  averageUnitCost: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Who registers a movement and why; shared by every kind of movement. */
export interface MovementContext extends Partial<MovementOrigin> {
  id: string;
  notes?: string | null;
  idempotencyKey?: string | null;
  createdByUserId?: string | null;
}

const QUANTITY_DECIMALS = 1000; // NUMERIC(14,3)
const COST_DECIMALS = 10000; // NUMERIC(14,4)

/**
 * The stock of a master supply in one restaurant (Arroz in Miraflores: 25 kg,
 * minimum 5, average cost S/4.50). current_quantity never changes directly:
 * every change returns the movement that must be saved in the same
 * transaction, with the balance before and after.
 */
export class RestaurantSupply {
  private constructor(private props: RestaurantSupplyProps) {}

  static enable(params: {
    id: string;
    restaurantId: string;
    supplyId: string;
    minimumQuantity?: number;
  }): RestaurantSupply {
    const now = new Date();
    const restaurantSupply = new RestaurantSupply({
      id: params.id,
      restaurantId: params.restaurantId,
      supplyId: params.supplyId,
      currentQuantity: 0,
      minimumQuantity: 0,
      averageUnitCost: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    restaurantSupply.configure(params);
    return restaurantSupply;
  }

  static fromPersistence(props: RestaurantSupplyProps): RestaurantSupply {
    return new RestaurantSupply(props);
  }

  /** Settings only; the stock is never part of a configuration change. */
  configure(params: { minimumQuantity?: number; isActive?: boolean }): void {
    if (params.minimumQuantity !== undefined) {
      if (params.minimumQuantity < 0) {
        throw new ValidationDomainError('El stock mínimo no puede ser negativo');
      }
      this.props.minimumQuantity = round(params.minimumQuantity, QUANTITY_DECIMALS);
    }
    if (params.isActive !== undefined) {
      this.props.isActive = params.isActive;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Purchases, usage, waste and manual corrections. The type decides the
   * sign; a purchase with unit cost updates the weighted average cost.
   */
  register(
    type: ManualMovementType,
    quantity: number,
    context: MovementContext & { unitCost?: number | null },
  ): InventoryMovement {
    if (quantity <= 0) {
      throw new InvalidMovementQuantityError('La cantidad del movimiento debe ser mayor a 0');
    }
    const amount = round(quantity, QUANTITY_DECIMALS);
    const delta = movementEffect(type) === MovementEffect.INCREASE ? amount : -amount;
    const unitCost = type === MovementTypeCode.PURCHASE ? (context.unitCost ?? null) : null;
    if (unitCost !== null && unitCost < 0) {
      throw new InvalidMovementQuantityError('El costo unitario no puede ser negativo');
    }
    if (unitCost !== null) {
      const resulting = this.props.currentQuantity + amount;
      this.props.averageUnitCost = round(
        (this.props.currentQuantity * this.props.averageUnitCost + amount * unitCost) / resulting,
        COST_DECIMALS,
      );
    }
    return this.apply(type, delta, { ...context, unitCost });
  }

  /**
   * Physical count: the backend computes the difference with the recorded
   * balance. Returns null when there is nothing to adjust.
   */
  count(countedQuantity: number, context: MovementContext): InventoryMovement | null {
    if (countedQuantity < 0) {
      throw new InvalidMovementQuantityError('La cantidad contada no puede ser negativa');
    }
    const counted = round(countedQuantity, QUANTITY_DECIMALS);
    const delta = round(counted - this.props.currentQuantity, QUANTITY_DECIMALS);
    if (delta === 0) {
      return null;
    }
    const type =
      delta > 0 ? MovementTypeCode.COUNT_ADJUSTMENT_IN : MovementTypeCode.COUNT_ADJUSTMENT_OUT;
    return this.apply(type, delta, { ...context, countedQuantity: counted });
  }

  /** Undoes another movement of this restaurant supply with the opposite delta. */
  reverse(original: InventoryMovement, context: MovementContext): InventoryMovement {
    if (original.type === MovementTypeCode.REVERSAL) {
      throw new ReversalNotReversibleError();
    }
    return this.apply(MovementTypeCode.REVERSAL, -original.quantityDelta, {
      ...context,
      reversalOfMovementId: original.id,
    });
  }

  /**
   * Automatic consumption never blocks the kitchen: it takes what is left
   * (possibly less than required). Returns null when the stock is empty.
   */
  consumeAvailable(required: number, context: MovementContext): InventoryMovement | null {
    const consumed = Math.min(round(required, QUANTITY_DECIMALS), this.props.currentQuantity);
    if (consumed <= 0) {
      return null;
    }
    return this.register(MovementTypeCode.USAGE, consumed, context);
  }

  /** Alert: the balance reached or went below the configured minimum. */
  get isLowStock(): boolean {
    return this.props.minimumQuantity > 0 && this.props.currentQuantity <= this.props.minimumQuantity;
  }

  private apply(
    type: MovementTypeCode,
    delta: number,
    context: MovementContext & {
      unitCost?: number | null;
      countedQuantity?: number;
      reversalOfMovementId?: string;
    },
  ): InventoryMovement {
    const previous = this.props.currentQuantity;
    const resulting = round(previous + delta, QUANTITY_DECIMALS);
    if (resulting < 0) {
      throw new InsufficientStockError(previous, Math.abs(delta));
    }
    this.props.currentQuantity = resulting;
    this.props.updatedAt = new Date();
    return InventoryMovement.record({
      id: context.id,
      restaurantSupplyId: this.props.id,
      type,
      quantityDelta: round(delta, QUANTITY_DECIMALS),
      previousQuantity: previous,
      resultingQuantity: resulting,
      countedQuantity: context.countedQuantity ?? null,
      unitCost: context.unitCost ?? null,
      notes: context.notes ?? null,
      originModule: context.originModule ?? null,
      originId: context.originId ?? null,
      idempotencyKey: context.idempotencyKey ?? null,
      createdByUserId: context.createdByUserId ?? null,
      reversalOfMovementId: context.reversalOfMovementId ?? null,
    });
  }

  get id(): string {
    return this.props.id;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get supplyId(): string {
    return this.props.supplyId;
  }
  get currentQuantity(): number {
    return this.props.currentQuantity;
  }
  get minimumQuantity(): number {
    return this.props.minimumQuantity;
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

function round(value: number, factor: number): number {
  return Math.round(value * factor) / factor;
}
