import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class RestaurantFloorNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el piso con id "${id}"`);
  }
}

export class DuplicateRestaurantFloorNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`La sede ya tiene un piso llamado "${name}"`);
  }
}
