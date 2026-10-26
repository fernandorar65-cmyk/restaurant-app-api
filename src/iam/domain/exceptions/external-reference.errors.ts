import { NotFoundDomainError } from '../../../common/domain/domain-error.js';

/**
 * References to entities owned by the organizations context, resolved
 * through IAM's own lookup port (see application/ports).
 */
export class OrganizationReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la organización con id "${id}"`);
  }
}

export class RestaurantReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el restaurante con id "${id}"`);
  }
}
