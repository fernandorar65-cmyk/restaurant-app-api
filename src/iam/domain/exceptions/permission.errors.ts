import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class PermissionNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Permission with id "${id}" not found`);
  }
}

export class DuplicatePermissionCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`Permission "${code}" already exists`);
  }
}
