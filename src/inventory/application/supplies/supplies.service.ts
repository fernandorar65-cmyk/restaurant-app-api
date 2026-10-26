import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { Supply } from '../../domain/entities/supply.entity.js';
import type { SupplyDetails } from '../../domain/entities/supply.entity.js';
import {
  CategoryFromAnotherOrganizationError,
  DuplicateSupplyCodeError,
  OrganizationReferenceNotFoundError,
  SupplyNotFoundError,
  SupplyUnitLockedError,
} from '../../domain/exceptions/inventory.errors.js';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../domain/repositories/inventory-movement.repository.js';
import type { InventoryMovementRepository } from '../../domain/repositories/inventory-movement.repository.js';
import { SUPPLY_REPOSITORY } from '../../domain/repositories/supply.repository.js';
import type { SupplyRepository } from '../../domain/repositories/supply.repository.js';
import { InventoryCatalogService } from '../inventory-catalog/inventory-catalog.service.js';
import { InventoryCategoriesService } from '../inventory-categories/inventory-categories.service.js';
import { ORGANIZATION_LOOKUP } from '../ports/organization-lookup.port.js';
import type { OrganizationLookupPort } from '../ports/organization-lookup.port.js';

export interface CreateSupplyInput extends SupplyDetails {
  organizationId: string;
  categoryId: string;
  code: string;
  name: string;
  unitCode: string;
}

export interface UpdateSupplyInput extends SupplyDetails {
  categoryId?: string;
  unitCode?: string;
  isActive?: boolean;
}

/** Master catalog of supplies of an organization (no stock here). */
@Injectable()
export class SuppliesService {
  constructor(
    @Inject(SUPPLY_REPOSITORY) private readonly supplyRepository: SupplyRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY)
    private readonly movementRepository: InventoryMovementRepository,
    @Inject(ORGANIZATION_LOOKUP) private readonly organizationLookup: OrganizationLookupPort,
    private readonly categoriesService: InventoryCategoriesService,
    private readonly catalogService: InventoryCatalogService,
  ) {}

  async create(input: CreateSupplyInput): Promise<Supply> {
    if (!(await this.organizationLookup.organizationExists(input.organizationId))) {
      throw new OrganizationReferenceNotFoundError(input.organizationId);
    }
    await this.assertCategoryOfOrganization(input.categoryId, input.organizationId);
    const unit = await this.catalogService.requireActiveUnit(input.unitCode);
    const supply = Supply.create({ ...input, id: randomUUID(), unitCode: unit.code });
    await this.assertCodeIsFree(supply);
    return this.supplyRepository.save(supply);
  }

  findPage(
    filter: { organizationId?: string; categoryId?: string; isActive?: boolean },
    page: PageRequest,
  ): Promise<Page<Supply>> {
    return this.supplyRepository.findPage(filter, page);
  }

  findByIds(ids: string[]): Promise<Supply[]> {
    return this.supplyRepository.findByIds(ids);
  }

  async findOne(id: string): Promise<Supply> {
    const supply = await this.supplyRepository.findById(id);
    if (!supply) {
      throw new SupplyNotFoundError(id);
    }
    return supply;
  }

  /**
   * The base unit can only change while no restaurant has moved stock of
   * the supply; afterwards it would need a controlled conversion.
   */
  async update(id: string, input: UpdateSupplyInput): Promise<Supply> {
    const supply = await this.findOne(id);
    if (input.categoryId && input.categoryId !== supply.categoryId) {
      await this.assertCategoryOfOrganization(input.categoryId, supply.organizationId);
    }
    if (input.unitCode) {
      const unit = await this.catalogService.requireActiveUnit(input.unitCode);
      if (unit.code !== supply.unitCode) {
        if (await this.movementRepository.existsForSupply(supply.id)) {
          throw new SupplyUnitLockedError();
        }
        supply.changeUnit(unit.code);
      }
    }
    supply.update(input);
    await this.assertCodeIsFree(supply);
    return this.supplyRepository.save(supply);
  }

  /** Logical delete: restaurants keep its history; it just can't be enabled anymore. */
  async deactivate(id: string): Promise<void> {
    const supply = await this.findOne(id);
    supply.update({ isActive: false });
    await this.supplyRepository.save(supply);
  }

  private async assertCategoryOfOrganization(
    categoryId: string,
    organizationId: string,
  ): Promise<void> {
    const category = await this.categoriesService.findOne(categoryId);
    if (category.organizationId !== organizationId) {
      throw new CategoryFromAnotherOrganizationError();
    }
  }

  private async assertCodeIsFree(supply: Supply): Promise<void> {
    const existing = await this.supplyRepository.findByCode(supply.organizationId, supply.code);
    if (existing && existing.id !== supply.id) {
      throw new DuplicateSupplyCodeError(supply.code);
    }
  }
}
