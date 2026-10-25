import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../../common/domain/domain-error.js';

export class PermissionNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Permission with id "${id}" not found`);
  }
}

export class DuplicatePermissionNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`Permission "${name}" already exists`);
  }
}
