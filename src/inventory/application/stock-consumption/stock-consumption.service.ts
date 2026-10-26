import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../domain/repositories/inventory-movement.repository.js';
import type { InventoryMovementRepository } from '../../domain/repositories/inventory-movement.repository.js';
import { PRODUCT_RECIPE_REPOSITORY } from '../../domain/repositories/product-recipe.repository.js';
import type { ProductRecipeRepository } from '../../domain/repositories/product-recipe.repository.js';
import { RESTAURANT_SUPPLY_REPOSITORY } from '../../domain/repositories/restaurant-supply.repository.js';
import type { RestaurantSupplyRepository } from '../../domain/repositories/restaurant-supply.repository.js';
import { PRODUCT_LOOKUP } from '../ports/product-lookup.port.js';
import type { ProductLookupPort } from '../ports/product-lookup.port.js';

export interface ConsumeForProductInput {
  productId: string;
  /** Units of the product prepared (e.g. the order item quantity). */
  units: number;
  /** Who asks for it, e.g. ATTENTION + the order item id. */
  originModule: string;
  originId: string;
  createdByUserId?: string | null;
}

export interface ConsumptionLine {
  supplyId: string;
  required: number;
  consumed: number;
  /** required - consumed when there was not enough stock (or the restaurant doesn't stock it). */
  shortage: number;
}

const QUANTITY_DECIMALS = 1000; // NUMERIC(14,3)

/**
 * Automatic discount of a product's recipe from the stock of the restaurant
 * that prepares it. Disabled unless INVENTORY_AUTO_CONSUMPTION=true while
 * the business flow (when to consume, how to revert) is confirmed.
 *
 * Never blocks the kitchen: it consumes what is left and records the
 * shortage. Idempotent: one USAGE per (restaurant supply, origin).
 */
@Injectable()
export class StockConsumptionService {
  constructor(
    @Inject(PRODUCT_RECIPE_REPOSITORY) private readonly recipeRepository: ProductRecipeRepository,
    @Inject(RESTAURANT_SUPPLY_REPOSITORY)
    private readonly restaurantSupplyRepository: RestaurantSupplyRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY)
    private readonly movementRepository: InventoryMovementRepository,
    @Inject(PRODUCT_LOOKUP) private readonly productLookup: ProductLookupPort,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: TransactionRunner,
    private readonly config: ConfigService,
  ) {}

  get isEnabled(): boolean {
    return this.config.get<string>('INVENTORY_AUTO_CONSUMPTION') === 'true';
  }

  async consumeForProduct(input: ConsumeForProductInput): Promise<ConsumptionLine[]> {
    if (!this.isEnabled) {
      return [];
    }
    const recipe = await this.recipeRepository.findByProduct(input.productId);
    const restaurantId = recipe.length
      ? await this.productLookup.findRestaurantId(input.productId)
      : null;
    if (!restaurantId) {
      return [];
    }
    const idempotencyKey = `${input.originModule}:${input.originId}`;
    return this.transactionRunner.run(async (tx) => {
      const lines: ConsumptionLine[] = [];
      for (const line of recipe) {
        const required = round(line.effectiveQuantity * input.units);
        const restaurantSupply = await this.restaurantSupplyRepository.findForUpdate(
          restaurantId,
          line.supplyId,
          tx,
        );
        if (!restaurantSupply?.isActive) {
          lines.push({ supplyId: line.supplyId, required, consumed: 0, shortage: required });
          continue;
        }
        if (
          await this.movementRepository.findByIdempotencyKey(restaurantSupply.id, idempotencyKey, tx)
        ) {
          continue;
        }
        const available = restaurantSupply.currentQuantity;
        const shortage = round(Math.max(0, required - available));
        const movement = restaurantSupply.consumeAvailable(required, {
          id: randomUUID(),
          idempotencyKey,
          originModule: input.originModule,
          originId: input.originId,
          createdByUserId: input.createdByUserId,
          notes: shortage > 0 ? `Consumo automático; faltante de ${shortage}` : 'Consumo automático',
        });
        lines.push({
          supplyId: line.supplyId,
          required,
          consumed: round(required - shortage),
          shortage,
        });
        if (movement) {
          await this.restaurantSupplyRepository.save(restaurantSupply, tx);
          await this.movementRepository.insert(movement, tx);
        }
      }
      return lines;
    });
  }
}

function round(value: number): number {
  return Math.round(value * QUANTITY_DECIMALS) / QUANTITY_DECIMALS;
}
