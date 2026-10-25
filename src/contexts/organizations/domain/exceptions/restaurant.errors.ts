import { NotFoundDomainError } from '../../../../common/domain/domain-error.js';

export class RestaurantNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Restaurant with id "${id}" not found`);
  }
}
