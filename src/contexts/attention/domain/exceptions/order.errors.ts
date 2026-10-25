import { NotFoundDomainError } from '../../../../common/domain/domain-error.js';

export class OrderNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Order with id "${id}" not found`);
  }
}
