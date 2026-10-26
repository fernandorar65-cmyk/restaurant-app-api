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
    super(`La sede ya tiene un insumo con el código "${code}"`);
  }
}

export class CategoryFromAnotherOrganizationError extends ValidationDomainError {
  constructor() {
    super('La categoría de inventario pertenece a otra organización');
  }
}

export class InsufficientStockError extends BusinessRuleDomainError {
  constructor(supplyName: string, available: number) {
    super(`No hay stock suficiente de "${supplyName}" (disponible: ${available})`);
  }
}

export class NoStockDifferenceError extends BusinessRuleDomainError {
  constructor() {
    super('La cantidad contada coincide con el stock actual; no hay nada que registrar');
  }
}

export class InactiveSupplyError extends BusinessRuleDomainError {
  constructor(id: string) {
    super(`El insumo "${id}" está inactivo`);
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

export class SupplyFromAnotherRestaurantError extends ValidationDomainError {
  constructor() {
    super('El insumo pertenece a otra sede que el producto');
  }
}
