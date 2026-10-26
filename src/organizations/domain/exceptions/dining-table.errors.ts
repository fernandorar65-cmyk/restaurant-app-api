import {
  ConflictDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';

export class DiningTableNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la mesa con id "${id}"`);
  }
}

export class DuplicateDiningTableCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`La sede ya tiene una mesa con el código "${code}"`);
  }
}

export class FloorFromAnotherRestaurantError extends ValidationDomainError {
  constructor() {
    super('El piso no pertenece a la sede de la mesa');
  }
}
