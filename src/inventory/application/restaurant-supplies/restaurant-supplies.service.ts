import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { InventoryMovement } from '../../domain/entities/inventory-movement.entity.js';
import { RestaurantSupply } from '../../domain/entities/restaurant-supply.entity.js';
import type { MovementContext } from '../../domain/entities/restaurant-supply.entity.js';
import { Supply } from '../../domain/entities/supply.entity.js';
import type { ManualMovementType } from '../../domain/enums/movement-type-code.enum.js';
import {
  DuplicateRestaurantSupplyError,
  InactiveSupplyError,
  MovementAlreadyReversedError,
  MovementNotFoundError,
  RestaurantReferenceNotFoundError,
  RestaurantSupplyNotFoundError,
  SupplyFromAnotherOrganizationError,
} from '../../domain/exceptions/inventory.errors.js';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../domain/repositories/inventory-movement.repository.js';
import type { InventoryMovementRepository } from '../../domain/repositories/inventory-movement.repository.js';
import { RESTAURANT_SUPPLY_REPOSITORY } from '../../domain/repositories/restaurant-supply.repository.js';
import type {
  RestaurantSupplyFilter,
  RestaurantSupplyRepository,
} from '../../domain/repositories/restaurant-supply.repository.js';
import { ORGANIZATION_LOOKUP } from '../ports/organization-lookup.port.js';
import type { OrganizationLookupPort } from '../ports/organization-lookup.port.js';
import { SuppliesService } from '../supplies/supplies.service.js';

/** A restaurant supply together with its master definition (code, name, unit). */
export interface RestaurantSupplyView {
  restaurantSupply: RestaurantSupply;
  supply: Supply;
}

export interface MovementResult {
  view: RestaurantSupplyView;
  /** Null for a count that matched the recorded balance. */
  movement: InventoryMovement | null;
  /** False when the idempotency key had already been used. */
  created: boolean;
}

export interface MovementAuthor {
  notes?: string | null;
  idempotencyKey?: string | null;
  createdByUserId?: string | null;
}

/**
 * Stock of each restaurant. Every change goes through a movement saved in
 * the same transaction as the new balance, with the restaurant supply row
 * locked, so concurrent movements never lose updates.
 */
@Injectable()
export class RestaurantSuppliesService {
  constructor(
    @Inject(RESTAURANT_SUPPLY_REPOSITORY)
    private readonly restaurantSupplyRepository: RestaurantSupplyRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY)
    private readonly movementRepository: InventoryMovementRepository,
    @Inject(ORGANIZATION_LOOKUP) private readonly organizationLookup: OrganizationLookupPort,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: TransactionRunner,
    private readonly suppliesService: SuppliesService,
  ) {}

  /** A restaurant starts using a supply of its organization (stock 0). */
  async enable(input: {
    restaurantId: string;
    supplyId: string;
    minimumQuantity?: number;
  }): Promise<RestaurantSupplyView> {
    const supply = await this.suppliesService.findOne(input.supplyId);
    if (!supply.isActive) {
      throw new InactiveSupplyError(supply.id);
    }
    const organizationId = await this.organizationLookup.findRestaurantOrganizationId(
      input.restaurantId,
    );
    if (!organizationId) {
      throw new RestaurantReferenceNotFoundError(input.restaurantId);
    }
    if (organizationId !== supply.organizationId) {
      throw new SupplyFromAnotherOrganizationError();
    }
    if (await this.restaurantSupplyRepository.find(input.restaurantId, supply.id)) {
      throw new DuplicateRestaurantSupplyError();
    }
    const restaurantSupply = await this.restaurantSupplyRepository.save(
      RestaurantSupply.enable({ id: randomUUID(), ...input }),
    );
    return { restaurantSupply, supply };
  }

  async findPage(
    filter: RestaurantSupplyFilter,
    page: PageRequest,
  ): Promise<Page<RestaurantSupplyView>> {
    const result = await this.restaurantSupplyRepository.findPage(filter, page);
    const supplies = await this.suppliesService.findByIds([
      ...new Set(result.items.map((item) => item.supplyId)),
    ]);
    const byId = new Map(supplies.map((supply) => [supply.id, supply]));
    return {
      ...result,
      items: result.items.map((restaurantSupply) => ({
        restaurantSupply,
        supply: byId.get(restaurantSupply.supplyId) as Supply,
      })),
    };
  }

  async findOne(id: string): Promise<RestaurantSupplyView> {
    const restaurantSupply = await this.restaurantSupplyRepository.findById(id);
    if (!restaurantSupply) {
      throw new RestaurantSupplyNotFoundError(id);
    }
    return { restaurantSupply, supply: await this.suppliesService.findOne(restaurantSupply.supplyId) };
  }

  /** Minimum and active flag only; the stock changes through movements. */
  async configure(
    id: string,
    input: { minimumQuantity?: number; isActive?: boolean },
  ): Promise<RestaurantSupplyView> {
    const { restaurantSupply, supply } = await this.findOne(id);
    restaurantSupply.configure(input);
    return {
      restaurantSupply: await this.restaurantSupplyRepository.save(restaurantSupply),
      supply,
    };
  }

  /** Logical delete: the restaurant keeps the stock history. */
  async deactivate(id: string): Promise<void> {
    await this.configure(id, { isActive: false });
  }

  registerMovement(
    id: string,
    input: MovementAuthor & { type: ManualMovementType; quantity: number; unitCost?: number | null },
  ): Promise<MovementResult> {
    return this.runMovement(id, input, (restaurantSupply, context) =>
      restaurantSupply.register(input.type, input.quantity, { ...context, unitCost: input.unitCost }),
    );
  }

  /** Physical count: the backend computes and records the difference. */
  count(id: string, input: MovementAuthor & { countedQuantity: number }): Promise<MovementResult> {
    return this.runMovement(id, input, (restaurantSupply, context) =>
      restaurantSupply.count(input.countedQuantity, context),
    );
  }

  /** Corrects a wrong movement with an opposite one; the original stays untouched. */
  async reverse(movementId: string, input: MovementAuthor): Promise<MovementResult> {
    const original = await this.movementRepository.findById(movementId);
    if (!original) {
      throw new MovementNotFoundError(movementId);
    }
    return this.runMovement(
      original.restaurantSupplyId,
      input,
      async (restaurantSupply, context, tx) => {
        if (await this.movementRepository.findReversalOf(original.id, tx)) {
          throw new MovementAlreadyReversedError();
        }
        return restaurantSupply.reverse(original, context);
      },
    );
  }

  async findMovement(id: string): Promise<InventoryMovement> {
    const movement = await this.movementRepository.findById(id);
    if (!movement) {
      throw new MovementNotFoundError(id);
    }
    return movement;
  }

  async listMovements(id: string, page: PageRequest): Promise<Page<InventoryMovement>> {
    await this.findOne(id);
    return this.movementRepository.findByRestaurantSupply(id, page);
  }

  /**
   * Locks the balance, honours the idempotency key, applies the movement
   * and saves balance and movement together.
   */
  private async runMovement(
    id: string,
    author: MovementAuthor,
    build: (
      restaurantSupply: RestaurantSupply,
      context: MovementContext,
      tx: TransactionContext,
    ) => InventoryMovement | null | Promise<InventoryMovement | null>,
  ): Promise<MovementResult> {
    const idempotencyKey = author.idempotencyKey?.trim() || null;
    const { movement, created } = await this.transactionRunner.run(async (tx) => {
      const restaurantSupply = await this.restaurantSupplyRepository.findByIdForUpdate(id, tx);
      if (!restaurantSupply) {
        throw new RestaurantSupplyNotFoundError(id);
      }
      if (idempotencyKey) {
        const previous = await this.movementRepository.findByIdempotencyKey(
          id,
          idempotencyKey,
          tx,
        );
        if (previous) {
          return { movement: previous, created: false };
        }
      }
      if (!restaurantSupply.isActive) {
        throw new InactiveSupplyError(id);
      }
      const applied = await build(
        restaurantSupply,
        {
          id: randomUUID(),
          notes: author.notes,
          idempotencyKey,
          createdByUserId: author.createdByUserId,
        },
        tx,
      );
      if (applied) {
        await this.restaurantSupplyRepository.save(restaurantSupply, tx);
        await this.movementRepository.insert(applied, tx);
      }
      return { movement: applied, created: applied !== null };
    });
    return { view: await this.findOne(id), movement, created };
  }
}
