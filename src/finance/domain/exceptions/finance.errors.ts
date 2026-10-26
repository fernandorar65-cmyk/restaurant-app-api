import {
  BusinessRuleDomainError,
  ConflictDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';

export class ExpenseCategoryNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la categoría de gasto con id "${id}"`);
  }
}

export class DuplicateExpenseCategoryNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`La organización ya tiene una categoría de gasto llamada "${name}"`);
  }
}

export class ExpenseNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el gasto con id "${id}"`);
  }
}

export class ExpenseVoidedError extends BusinessRuleDomainError {
  constructor() {
    super('El gasto está anulado y ya no se puede modificar');
  }
}

export class CategoryFromAnotherOrganizationError extends ValidationDomainError {
  constructor() {
    super('La categoría de gasto pertenece a otra organización');
  }
}

export class InactiveExpenseCategoryError extends BusinessRuleDomainError {
  constructor() {
    super('La categoría de gasto está inactiva');
  }
}

export class DailyClosureNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el cierre diario con id "${id}"`);
  }
}

export class DailyClosureAlreadyExistsError extends ConflictDomainError {
  constructor(businessDate: string) {
    super(`La sede ya tiene un cierre para el ${businessDate}`);
  }
}

export class FutureBusinessDateError extends ValidationDomainError {
  constructor(businessDate: string) {
    super(`No se puede cerrar una fecha futura (${businessDate})`);
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
