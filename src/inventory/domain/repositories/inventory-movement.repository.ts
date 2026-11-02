import type { MovementTypeCode } from '../enums/movement-type-code.enum.js';
import type { Page, PageRequest } from '../../../common/domain/pagination.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { InventoryMovement } from '../entities/inventory-movement.entity.js';

export const INVENTORY_MOVEMENT_REPOSITORY = Symbol('INVENTORY_MOVEMENT_REPOSITORY');

export interface RestaurantMovementFilter {
  restaurantId: string;
  supplyId?: string;
  type?: MovementTypeCode;
  /** Business dates (YYYY-MM-DD), inclusive, in the restaurant's time zone. */
  from?: string;
  to?: string;
  timeZone: string;
}

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
  /** Every movement of a restaurant's stock, most recent first. */
  findByRestaurant(
    filter: RestaurantMovementFilter,
    page: PageRequest,
  ): Promise<Page<InventoryMovement>>;
  /** Whether any restaurant already moved stock of this master supply. */
  existsForSupply(supplyId: string): Promise<boolean>;
}
