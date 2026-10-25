import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../../common/domain/domain-error.js';

export class RolePermissionNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Role-permission with id "${id}" not found`);
  }
}

export class DuplicateRolePermissionError extends ConflictDomainError {
  constructor() {
    super('This role already has the given permission assigned');
  }
}
