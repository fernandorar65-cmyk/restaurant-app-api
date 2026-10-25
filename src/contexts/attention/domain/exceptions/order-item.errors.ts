import { NotFoundDomainError } from '../../../../common/domain/domain-error.js';

export class OrderItemNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Order item with id "${id}" not found`);
  }
}
