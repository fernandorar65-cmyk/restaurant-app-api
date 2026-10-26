import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class UserNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el usuario con id "${id}"`);
  }
}

export class DuplicateEmailError extends ConflictDomainError {
  constructor(email: string) {
    super(`Ya existe un usuario con el correo "${email}"`);
  }
}
