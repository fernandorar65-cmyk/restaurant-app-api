import { NotFoundDomainError } from '../../../../common/domain/domain-error.js';

export class DiningTableNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Dining table with id "${id}" not found`);
  }
}
