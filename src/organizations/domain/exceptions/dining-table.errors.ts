import {
  ConflictDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';

export class DiningTableNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Dining table with id "${id}" not found`);
  }
}

export class DuplicateDiningTableCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`The restaurant already has a table with code "${code}"`);
  }
}

export class FloorFromAnotherRestaurantError extends ValidationDomainError {
  constructor() {
    super('The floor does not belong to the table restaurant');
  }
}
