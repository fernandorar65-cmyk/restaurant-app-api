import {
  BusinessRuleDomainError,
  ConflictDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';

export class InventoryCategoryNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Inventory category with id "${id}" not found`);
  }
}

export class DuplicateInventoryCategoryNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`The organization already has an inventory category named "${name}"`);
  }
}

export class SupplyNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Supply with id "${id}" not found`);
  }
}

export class DuplicateSupplyCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`The restaurant already has a supply with code "${code}"`);
  }
}

export class CategoryFromAnotherOrganizationError extends ValidationDomainError {
  constructor() {
    super('The inventory category belongs to another organization');
  }
}

export class InsufficientStockError extends BusinessRuleDomainError {
  constructor(supplyName: string, available: number) {
    super(`Not enough stock of "${supplyName}" (available: ${available})`);
  }
}

export class NoStockDifferenceError extends BusinessRuleDomainError {
  constructor() {
    super('The counted quantity matches the current stock; nothing to register');
  }
}

export class InactiveSupplyError extends BusinessRuleDomainError {
  constructor(id: string) {
    super(`Supply "${id}" is inactive`);
  }
}

export class OrganizationReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Organization with id "${id}" not found`);
  }
}

export class RestaurantReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Restaurant with id "${id}" not found`);
  }
}
