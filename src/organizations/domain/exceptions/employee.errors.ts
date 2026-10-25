import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class EmployeeNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Employee with id "${id}" not found`);
  }
}

export class DuplicateEmployeeCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`The organization already has an employee with code "${code}"`);
  }
}

export class UserAlreadyEmployeeError extends ConflictDomainError {
  constructor() {
    super('That user is already linked to another employee of the organization');
  }
}

export class UserReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`User with id "${id}" not found`);
  }
}
