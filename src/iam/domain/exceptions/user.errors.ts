import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class UserNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`User with id "${id}" not found`);
  }
}

export class DuplicateEmailError extends ConflictDomainError {
  constructor(email: string) {
    super(`A user with email "${email}" already exists`);
  }
}
