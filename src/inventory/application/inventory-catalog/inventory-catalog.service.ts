import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import {
  InventoryCatalogEntryNotFoundError,
  UnitOfMeasureNotFoundError,
} from '../../domain/exceptions/inventory.errors.js';
import { MOVEMENT_TYPES, UNITS_OF_MEASURE } from '../../domain/inventory-catalog.js';
import { INVENTORY_CATALOG_REPOSITORY } from '../../domain/repositories/inventory-catalog.repository.js';
import type {
  InventoryCatalogRepository,
  MovementType,
  UnitOfMeasure,
} from '../../domain/repositories/inventory-catalog.repository.js';

/**
 * Units of measure and movement types: platform-wide catalogs maintained by
 * ACMR (never by a restaurant). Created on startup; administrators can only
 * rename entries and enable/disable units.
 */
@Injectable()
export class InventoryCatalogService implements OnApplicationBootstrap {
  constructor(
    @Inject(INVENTORY_CATALOG_REPOSITORY)
    private readonly catalogRepository: InventoryCatalogRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.catalogRepository.ensureCatalog(UNITS_OF_MEASURE, MOVEMENT_TYPES);
  }

  listUnits(): Promise<UnitOfMeasure[]> {
    return this.catalogRepository.findUnits();
  }

  listMovementTypes(): Promise<MovementType[]> {
    return this.catalogRepository.findMovementTypes();
  }

  /** A unit new supplies can use. */
  async requireActiveUnit(code: string): Promise<UnitOfMeasure> {
    const unit = await this.catalogRepository.findUnit(code.trim().toUpperCase());
    if (!unit?.isActive) {
      throw new UnitOfMeasureNotFoundError(code);
    }
    return unit;
  }

  /** Disabling a unit only stops new supplies from using it. */
  async updateUnit(
    code: string,
    input: { name?: string; isActive?: boolean },
  ): Promise<UnitOfMeasure> {
    if (!(await this.catalogRepository.findUnit(code))) {
      throw new InventoryCatalogEntryNotFoundError(code);
    }
    await this.catalogRepository.updateUnit(code, {
      name: input.name === undefined ? undefined : requireText(input.name, 'El nombre', { max: 50 }),
      isActive: input.isActive,
    });
    return (await this.catalogRepository.findUnit(code)) as UnitOfMeasure;
  }

  /** Only the visible name: the effect of a type on the stock is fixed. */
  async renameMovementType(code: string, name: string): Promise<MovementType> {
    if (!(await this.catalogRepository.findMovementType(code))) {
      throw new InventoryCatalogEntryNotFoundError(code);
    }
    await this.catalogRepository.renameMovementType(
      code,
      requireText(name, 'El nombre', { max: 100 }),
    );
    return (await this.catalogRepository.findMovementType(code)) as MovementType;
  }
}
