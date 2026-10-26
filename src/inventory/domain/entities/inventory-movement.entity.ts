import { MovementTypeCode } from '../enums/movement-type-code.enum.js';

export interface MovementOrigin {
  /** Context that generated it, e.g. ATTENTION for automatic consumption. */
  originModule: string | null;
  originId: string | null;
}

export interface InventoryMovementProps extends MovementOrigin {
  id: string;
  restaurantSupplyId: string;
  type: MovementTypeCode;
  /** Signed: positive for entries, negative for exits. Never 0. */
  quantityDelta: number;
  previousQuantity: number;
  resultingQuantity: number;
  /** Only for counts: what was physically found. */
  countedQuantity: number | null;
  unitCost: number | null;
  notes: string | null;
  /** Repeating a request with the same key returns this movement. */
  idempotencyKey: string | null;
  createdByUserId: string | null;
  /** Set on a REVERSAL: the movement it undoes. */
  reversalOfMovementId: string | null;
  createdAt: Date;
}

/**
 * Immutable record of why the stock of a restaurant changed. It is never
 * edited or deleted: a wrong movement is corrected with a REVERSAL.
 */
export class InventoryMovement {
  private constructor(private readonly props: InventoryMovementProps) {}

  static record(props: Omit<InventoryMovementProps, 'createdAt'>): InventoryMovement {
    return new InventoryMovement({ ...props, createdAt: new Date() });
  }

  static fromPersistence(props: InventoryMovementProps): InventoryMovement {
    return new InventoryMovement(props);
  }

  get id(): string {
    return this.props.id;
  }
  get restaurantSupplyId(): string {
    return this.props.restaurantSupplyId;
  }
  get type(): MovementTypeCode {
    return this.props.type;
  }
  get quantityDelta(): number {
    return this.props.quantityDelta;
  }
  get previousQuantity(): number {
    return this.props.previousQuantity;
  }
  get resultingQuantity(): number {
    return this.props.resultingQuantity;
  }
  get countedQuantity(): number | null {
    return this.props.countedQuantity;
  }
  get unitCost(): number | null {
    return this.props.unitCost;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get originModule(): string | null {
    return this.props.originModule;
  }
  get originId(): string | null {
    return this.props.originId;
  }
  get idempotencyKey(): string | null {
    return this.props.idempotencyKey;
  }
  get createdByUserId(): string | null {
    return this.props.createdByUserId;
  }
  get reversalOfMovementId(): string | null {
    return this.props.reversalOfMovementId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
