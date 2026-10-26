import type { Page, PageRequest } from '../../../common/application/pagination.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { InventoryMovement } from '../entities/inventory-movement.entity.js';

export const INVENTORY_MOVEMENT_REPOSITORY = Symbol('INVENTORY_MOVEMENT_REPOSITORY');

export interface InventoryMovementRepository {
  /** Most recent first. */
  findBySupply(supplyId: string, page: PageRequest): Promise<Page<InventoryMovement>>;
  /** Whether the reference (e.g. an order item) already moved this supply. */
  existsForReference(
    supplyId: string,
    referenceType: string,
    referenceId: string,
    tx?: TransactionContext,
  ): Promise<boolean>;
  save(
    movement: InventoryMovement,
    tx?: TransactionContext,
  ): Promise<InventoryMovement>;
}
