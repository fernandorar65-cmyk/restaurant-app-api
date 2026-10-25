import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class RoleNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Role with id "${id}" not found`);
  }
}

export class DuplicateRoleNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`Role "${name}" already exists`);
  }
}
