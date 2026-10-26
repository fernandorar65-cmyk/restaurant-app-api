import {
  BusinessRuleDomainError,
  ConflictDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';

export class InventoryCategoryNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la categoría de inventario con id "${id}"`);
  }
}

export class DuplicateInventoryCategoryNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`La organización ya tiene una categoría de inventario llamada "${name}"`);
  }
}

export class SupplyNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el insumo con id "${id}"`);
  }
}

export class DuplicateSupplyCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`La organización ya tiene un insumo con el código "${code}"`);
  }
}

export class CategoryFromAnotherOrganizationError extends ValidationDomainError {
  constructor() {
    super('La categoría de inventario pertenece a otra organización');
  }
}

export class InsufficientStockError extends BusinessRuleDomainError {
  constructor(available: number, requested: number) {
    super(`No hay stock suficiente (disponible: ${available}, solicitado: ${requested})`);
  }
}

export class InactiveSupplyError extends BusinessRuleDomainError {
  constructor(id: string) {
    super(`El insumo "${id}" está inactivo`);
  }
}

export class RestaurantSupplyNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el insumo de sede con id "${id}"`);
  }
}

export class DuplicateRestaurantSupplyError extends ConflictDomainError {
  constructor() {
    super('La sede ya tiene habilitado ese insumo (reactívalo si estaba desactivado)');
  }
}

export class SupplyFromAnotherOrganizationError extends ValidationDomainError {
  constructor() {
    super('El insumo pertenece a otra organización');
  }
}

export class UnitOfMeasureNotFoundError extends NotFoundDomainError {
  constructor(code: string) {
    super(`No existe la unidad de medida "${code}" o está desactivada`);
  }
}

export class SupplyUnitLockedError extends BusinessRuleDomainError {
  constructor() {
    super('El insumo ya tiene movimientos: su unidad base solo puede cambiarse con una conversión controlada');
  }
}

export class InvalidMovementQuantityError extends ValidationDomainError {
  constructor(message: string) {
    super(message);
  }
}

export class MovementNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el movimiento de inventario con id "${id}"`);
  }
}

export class MovementAlreadyReversedError extends ConflictDomainError {
  constructor() {
    super('El movimiento ya fue revertido');
  }
}

export class ReversalNotReversibleError extends BusinessRuleDomainError {
  constructor() {
    super('Una reversión no se revierte; registra un movimiento nuevo');
  }
}

export class InventoryCatalogEntryNotFoundError extends NotFoundDomainError {
  constructor(code: string) {
    super(`No existe el código "${code}" en el catálogo de inventario`);
  }
}

export class OrganizationReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la organización con id "${id}"`);
  }
}

export class RestaurantReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el restaurante con id "${id}"`);
  }
}

export class ProductReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el producto con id "${id}"`);
  }
}

export class RecipeLineNotFoundError extends NotFoundDomainError {
  constructor() {
    super('La receta del producto no usa ese insumo');
  }
}

export class RecipeSupplyFromAnotherOrganizationError extends ValidationDomainError {
  constructor() {
    super('El insumo pertenece a otra organización que el producto');
  }
}
