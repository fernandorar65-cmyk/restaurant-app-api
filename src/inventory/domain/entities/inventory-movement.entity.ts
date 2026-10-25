import { InventoryMovementType } from '../enums/inventory-movement-type.enum.js';

export interface InventoryMovementProps {
  id: string;
  supplyId: string;
  movementType: InventoryMovementType;
  /** Always positive; the direction is given by previous/resulting quantity. */
  quantity: number;
  unitCost: number | null;
  previousQuantity: number;
  resultingQuantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdByUserId: string | null;
  createdAt: Date;
}

/** Immutable record of a stock change. Created only by Supply.registerMovement. */
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
  get supplyId(): string {
    return this.props.supplyId;
  }
  get movementType(): InventoryMovementType {
    return this.props.movementType;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get unitCost(): number | null {
    return this.props.unitCost;
  }
  get previousQuantity(): number {
    return this.props.previousQuantity;
  }
  get resultingQuantity(): number {
    return this.props.resultingQuantity;
  }
  get referenceType(): string | null {
    return this.props.referenceType;
  }
  get referenceId(): string | null {
    return this.props.referenceId;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get createdByUserId(): string | null {
    return this.props.createdByUserId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
