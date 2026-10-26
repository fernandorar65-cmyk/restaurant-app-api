import {
  BusinessRuleDomainError,
  ConflictDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';

export class WorkAreaNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el área con id "${id}"`);
  }
}

export class DuplicateWorkAreaNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`La organización ya tiene un área llamada "${name}"`);
  }
}

export class JobPositionNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el puesto con id "${id}"`);
  }
}

export class DuplicateJobPositionNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`El área ya tiene un puesto llamado "${name}"`);
  }
}

export class WorkAreaFromAnotherOrganizationError extends ValidationDomainError {
  constructor() {
    super('El área pertenece a otra organización');
  }
}

export class JobPositionFromAnotherOrganizationError extends ValidationDomainError {
  constructor() {
    super('El puesto pertenece a otra organización que el empleado');
  }
}

export class InactiveWorkAreaError extends BusinessRuleDomainError {
  constructor() {
    super('El área está inactiva; no se le pueden agregar puestos');
  }
}

export class InactiveJobPositionError extends BusinessRuleDomainError {
  constructor() {
    super('El puesto está inactivo; no se puede asignar a un empleado');
  }
}
