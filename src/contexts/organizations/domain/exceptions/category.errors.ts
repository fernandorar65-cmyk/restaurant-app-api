import { NotFoundDomainError } from '../../../../common/domain/domain-error.js';

export class CategoryNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Category with id "${id}" not found`);
  }
}
