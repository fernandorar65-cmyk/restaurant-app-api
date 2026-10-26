import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { InventoryMovementType } from '../../domain/enums/inventory-movement-type.enum.js';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../domain/repositories/inventory-movement.repository.js';
import type { InventoryMovementRepository } from '../../domain/repositories/inventory-movement.repository.js';
import { PRODUCT_RECIPE_REPOSITORY } from '../../domain/repositories/product-recipe.repository.js';
import type { ProductRecipeRepository } from '../../domain/repositories/product-recipe.repository.js';
import { SUPPLY_REPOSITORY } from '../../domain/repositories/supply.repository.js';
import type { SupplyRepository } from '../../domain/repositories/supply.repository.js';

export interface ConsumeForProductInput {
  productId: string;
  /** Units of the product prepared (e.g. the order item quantity). */
  units: number;
  referenceType: string;
  referenceId: string;
  createdByUserId?: string | null;
}

export interface ConsumptionLine {
  supplyId: string;
  required: number;
  consumed: number;
  /** required - consumed when there was not enough stock. */
  shortage: number;
}

const QUANTITY_DECIMALS = 1000; // NUMERIC(14,3)

/**
 * Discounts the supplies a product's recipe uses. Never blocks the kitchen:
 * if stock is short it consumes what is left and records the shortage on
 * the movement. Idempotent per (supply, reference), so retrying the same
 * order item never discounts twice.
 */
@Injectable()
export class StockConsumptionService {
  constructor(
    @Inject(PRODUCT_RECIPE_REPOSITORY)
    private readonly recipeRepository: ProductRecipeRepository,
    @Inject(SUPPLY_REPOSITORY) private readonly supplyRepository: SupplyRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY)
    private readonly movementRepository: InventoryMovementRepository,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
  ) {}

  async consumeForProduct(input: ConsumeForProductInput): Promise<ConsumptionLine[]> {
    const recipe = await this.recipeRepository.findByProduct(input.productId);
    if (recipe.length === 0) {
      return [];
    }
    return this.transactionRunner.run(async (tx) => {
      const lines: ConsumptionLine[] = [];
      for (const line of recipe) {
        const alreadyConsumed = await this.movementRepository.existsForReference(
          line.supplyId,
          input.referenceType,
          input.referenceId,
          tx,
        );
        if (alreadyConsumed) {
          continue;
        }
        const supply = await this.supplyRepository.findByIdForUpdate(line.supplyId, tx);
        if (!supply || !supply.isActive) {
          continue;
        }
        const required = round(line.effectiveQuantity * input.units);
        const consumed = Math.min(required, supply.currentQuantity);
        const shortage = round(required - consumed);
        lines.push({ supplyId: supply.id, required, consumed, shortage });
        if (consumed <= 0) {
          continue; // nothing left to discount; the shortage is still reported
        }
        const movement = supply.registerMovement({
          id: randomUUID(),
          type: InventoryMovementType.USAGE,
          quantity: consumed,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          createdByUserId: input.createdByUserId,
          notes: shortage > 0 ? `Consumo automático; faltante de ${shortage}` : 'Consumo automático',
        });
        await this.supplyRepository.save(supply, tx);
        await this.movementRepository.save(movement, tx);
      }
      return lines;
    });
  }
}

function round(value: number): number {
  return Math.round(value * QUANTITY_DECIMALS) / QUANTITY_DECIMALS;
}
