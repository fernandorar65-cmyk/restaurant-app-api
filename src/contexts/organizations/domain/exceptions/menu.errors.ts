import { NotFoundDomainError } from '../../../../common/domain/domain-error.js';

export class MenuNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Menu with id "${id}" not found`);
  }
}
