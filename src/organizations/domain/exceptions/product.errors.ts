import { NotFoundDomainError } from '../../../common/domain/domain-error.js';

export class ProductNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Product with id "${id}" not found`);
  }
}
