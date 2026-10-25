import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class RestaurantFloorNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Restaurant floor with id "${id}" not found`);
  }
}

export class DuplicateRestaurantFloorNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`The restaurant already has a floor named "${name}"`);
  }
}
