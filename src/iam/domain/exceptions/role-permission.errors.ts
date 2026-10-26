import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class RolePermissionNotFoundError extends NotFoundDomainError {
  constructor() {
    super('El rol no tiene asignado ese permiso');
  }
}

export class DuplicateRolePermissionError extends ConflictDomainError {
  constructor() {
    super('El rol ya tiene asignado ese permiso');
  }
}
