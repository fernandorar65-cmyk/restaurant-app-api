import type { Page, PageRequest } from '../../../common/application/pagination.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { InventoryMovement } from '../entities/inventory-movement.entity.js';

export const INVENTORY_MOVEMENT_REPOSITORY = Symbol('INVENTORY_MOVEMENT_REPOSITORY');

/** Insert-only: movements are never updated or deleted. */
export interface InventoryMovementRepository {
  insert(movement: InventoryMovement, tx: TransactionContext): Promise<void>;
  findById(id: string, tx?: TransactionContext): Promise<InventoryMovement | null>;
  findByIdempotencyKey(
    restaurantSupplyId: string,
    idempotencyKey: string,
    tx?: TransactionContext,
  ): Promise<InventoryMovement | null>;
  findReversalOf(movementId: string, tx?: TransactionContext): Promise<InventoryMovement | null>;
  findByRestaurantSupply(
    restaurantSupplyId: string,
    page: PageRequest,
  ): Promise<Page<InventoryMovement>>;
  /** Whether any restaurant already moved stock of this master supply. */
  existsForSupply(supplyId: string): Promise<boolean>;
}
