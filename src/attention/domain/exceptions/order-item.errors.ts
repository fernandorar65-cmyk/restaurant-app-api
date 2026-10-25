import {
  BusinessRuleDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class OrderItemNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Order item with id "${id}" not found`);
  }
}

export class ProductUnavailableError extends BusinessRuleDomainError {
  constructor(productId: string) {
    super(`Product with id "${productId}" is not available`);
  }
}
