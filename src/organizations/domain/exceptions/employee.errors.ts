import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class EmployeeNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el empleado con id "${id}"`);
  }
}

export class DuplicateEmployeeCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`La organización ya tiene un empleado con el código "${code}"`);
  }
}

export class UserAlreadyEmployeeError extends ConflictDomainError {
  constructor() {
    super('Ese usuario ya está vinculado a otro empleado de la organización');
  }
}

export class UserReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el usuario con id "${id}"`);
  }
}
