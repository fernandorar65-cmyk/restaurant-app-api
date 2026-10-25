import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class RoleNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Role with id "${id}" not found`);
  }
}

export class DuplicateRoleCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`The organization already has a role with code "${code}"`);
  }
}
