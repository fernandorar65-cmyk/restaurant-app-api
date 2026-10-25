import { NotFoundDomainError } from '../../../common/domain/domain-error.js';

/**
 * These represent references to entities owned by OTHER bounded contexts
 * (organizations, iam). Attention never imports those contexts' domain
 * exceptions directly — it only knows "this external id does not exist",
 * resolved through its own lookup ports (see application/ports).
 */

export class DiningTableReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Dining table with id "${id}" not found`);
  }
}

export class ProductReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Product with id "${id}" not found`);
  }
}
