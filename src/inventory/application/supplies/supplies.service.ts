import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { InventoryMovement } from '../../domain/entities/inventory-movement.entity.js';
import { Supply } from '../../domain/entities/supply.entity.js';
import type {
  MovementRequest,
  SupplyDetails,
} from '../../domain/entities/supply.entity.js';
import {
  CategoryFromAnotherOrganizationError,
  DuplicateSupplyCodeError,
  InactiveSupplyError,
  RestaurantReferenceNotFoundError,
  SupplyNotFoundError,
} from '../../domain/exceptions/inventory.errors.js';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../domain/repositories/inventory-movement.repository.js';
import type { InventoryMovementRepository } from '../../domain/repositories/inventory-movement.repository.js';
import { SUPPLY_REPOSITORY } from '../../domain/repositories/supply.repository.js';
import type { SupplyRepository } from '../../domain/repositories/supply.repository.js';
import { InventoryCategoriesService } from '../inventory-categories/inventory-categories.service.js';
import { ORGANIZATION_LOOKUP } from '../ports/organization-lookup.port.js';
import type { OrganizationLookupPort } from '../ports/organization-lookup.port.js';

export interface CreateSupplyInput extends SupplyDetails {
  restaurantId: string;
  categoryId: string;
  code: string;
  name: string;
  unitOfMeasure: string;
}

export interface UpdateSupplyInput extends SupplyDetails {
  categoryId?: string;
  isActive?: boolean;
}

export type RegisterMovementInput = DistributiveOmit<MovementRequest, 'id'>;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

@Injectable()
export class SuppliesService {
  constructor(
    @Inject(SUPPLY_REPOSITORY) private readonly supplyRepository: SupplyRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY)
    private readonly movementRepository: InventoryMovementRepository,
    @Inject(ORGANIZATION_LOOKUP)
    private readonly organizationLookup: OrganizationLookupPort,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    private readonly categoriesService: InventoryCategoriesService,
  ) {}

  /** Supplies start with zero stock; stock enters through a PURCHASE movement. */
  async create(input: CreateSupplyInput): Promise<Supply> {
    await this.assertCategoryFitsRestaurant(input.categoryId, input.restaurantId);
    const supply = Supply.create({ id: randomUUID(), ...input });
    await this.assertCodeIsFree(supply);
    return this.supplyRepository.save(supply);
  }

  findAll(
    filter: { restaurantId?: string; categoryId?: string } = {},
  ): Promise<Supply[]> {
    return this.supplyRepository.findAll(filter);
  }

  async findOne(id: string): Promise<Supply> {
    const supply = await this.supplyRepository.findById(id);
    if (!supply) {
      throw new SupplyNotFoundError(id);
    }
    return supply;
  }

  async update(id: string, input: UpdateSupplyInput): Promise<Supply> {
    const supply = await this.findOne(id);
    if (input.categoryId) {
      await this.assertCategoryFitsRestaurant(input.categoryId, supply.restaurantId);
    }
    supply.update(input);
    await this.assertCodeIsFree(supply);
    return this.supplyRepository.save(supply);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.supplyRepository.delete(id);
    if (!deleted) {
      throw new SupplyNotFoundError(id);
    }
  }

  /**
   * Changes the stock and records the movement in one transaction, locking
   * the supply row so concurrent movements can't read a stale quantity.
   */
  async registerMovement(
    supplyId: string,
    input: RegisterMovementInput,
  ): Promise<{ supply: Supply; movement: InventoryMovement }> {
    return this.transactionRunner.run(async (tx) => {
      const supply = await this.supplyRepository.findByIdForUpdate(supplyId, tx);
      if (!supply) {
        throw new SupplyNotFoundError(supplyId);
      }
      if (!supply.isActive) {
        throw new InactiveSupplyError(supplyId);
      }
      const movement = supply.registerMovement({
        ...input,
        id: randomUUID(),
      } as MovementRequest);
      const savedSupply = await this.supplyRepository.save(supply, tx);
      const savedMovement = await this.movementRepository.save(movement, tx);
      return { supply: savedSupply, movement: savedMovement };
    });
  }

  async listMovements(supplyId: string): Promise<InventoryMovement[]> {
    await this.findOne(supplyId);
    return this.movementRepository.findBySupply(supplyId);
  }

  private async assertCategoryFitsRestaurant(
    categoryId: string,
    restaurantId: string,
  ): Promise<void> {
    const category = await this.categoriesService.findOne(categoryId);
    const organizationId =
      await this.organizationLookup.findRestaurantOrganizationId(restaurantId);
    if (!organizationId) {
      throw new RestaurantReferenceNotFoundError(restaurantId);
    }
    if (organizationId !== category.organizationId) {
      throw new CategoryFromAnotherOrganizationError();
    }
  }

  private async assertCodeIsFree(supply: Supply): Promise<void> {
    const existing = await this.supplyRepository.findByCode(
      supply.restaurantId,
      supply.code,
    );
    if (existing && existing.id !== supply.id) {
      throw new DuplicateSupplyCodeError(supply.code);
    }
  }
}
