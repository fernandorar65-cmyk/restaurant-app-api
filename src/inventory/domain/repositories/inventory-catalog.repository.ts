import type { MovementEffect } from '../enums/movement-effect.enum.js';
import type { UnitDimension } from '../enums/unit-dimension.enum.js';
import type { MovementTypeDefinition, UnitDefinition } from '../inventory-catalog.js';

export const INVENTORY_CATALOG_REPOSITORY = Symbol('INVENTORY_CATALOG_REPOSITORY');

export interface UnitOfMeasure {
  code: string;
  name: string;
  dimension: UnitDimension;
  conversionFactorToBase: number;
  isActive: boolean;
}

export interface MovementType {
  code: string;
  name: string;
  effect: MovementEffect;
  isActive: boolean;
}

export interface InventoryCatalogRepository {
  findUnits(): Promise<UnitOfMeasure[]>;
  findUnit(code: string): Promise<UnitOfMeasure | null>;
  updateUnit(code: string, changes: { name?: string; isActive?: boolean }): Promise<void>;
  findMovementTypes(): Promise<MovementType[]>;
  findMovementType(code: string): Promise<MovementType | null>;
  renameMovementType(code: string, name: string): Promise<void>;
  /** Inserts missing codes and re-applies the fixed dimension/factor/effect. */
  ensureCatalog(units: UnitDefinition[], types: MovementTypeDefinition[]): Promise<void>;
}
