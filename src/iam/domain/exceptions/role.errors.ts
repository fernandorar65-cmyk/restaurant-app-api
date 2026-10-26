import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class RoleNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el rol con id "${id}"`);
  }
}

export class DuplicateRoleCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`La organización ya tiene un rol con el código "${code}"`);
  }
}
