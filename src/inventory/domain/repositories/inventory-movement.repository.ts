import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { InventoryMovement } from '../entities/inventory-movement.entity.js';

export const INVENTORY_MOVEMENT_REPOSITORY = Symbol('INVENTORY_MOVEMENT_REPOSITORY');

export interface InventoryMovementRepository {
  findBySupply(supplyId: string): Promise<InventoryMovement[]>;
  save(
    movement: InventoryMovement,
    tx?: TransactionContext,
  ): Promise<InventoryMovement>;
}
