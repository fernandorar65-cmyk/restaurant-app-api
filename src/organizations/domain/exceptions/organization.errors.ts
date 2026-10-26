import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class OrganizationNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la organización con id "${id}"`);
  }
}

export class DuplicateTaxIdentifierError extends ConflictDomainError {
  constructor(taxIdentifier: string) {
    super(`Ya existe una organización con el identificador fiscal "${taxIdentifier}"`);
  }
}
