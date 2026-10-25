import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class RolePermissionNotFoundError extends NotFoundDomainError {
  constructor() {
    super('The role does not have that permission assigned');
  }
}

export class DuplicateRolePermissionError extends ConflictDomainError {
  constructor() {
    super('This role already has the given permission assigned');
  }
}
