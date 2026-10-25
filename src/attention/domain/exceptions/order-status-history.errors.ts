import { NotFoundDomainError } from '../../../common/domain/domain-error.js';

export class OrderStatusHistoryNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Order status history entry with id "${id}" not found`);
  }
}
