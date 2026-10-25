import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class OrganizationNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Organization with id "${id}" not found`);
  }
}

export class DuplicateOrganizationNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`Organization "${name}" already exists`);
  }
}
