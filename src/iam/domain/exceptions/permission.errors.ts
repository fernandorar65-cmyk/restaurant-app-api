import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class PermissionNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el permiso con id "${id}"`);
  }
}

export class DuplicatePermissionCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`El permiso "${code}" ya existe`);
  }
}
