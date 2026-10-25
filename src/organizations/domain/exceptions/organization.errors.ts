import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class OrganizationNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Organization with id "${id}" not found`);
  }
}

export class DuplicateTaxIdentifierError extends ConflictDomainError {
  constructor(taxIdentifier: string) {
    super(`An organization with tax identifier "${taxIdentifier}" already exists`);
  }
}
