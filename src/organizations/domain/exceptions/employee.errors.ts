import { NotFoundDomainError } from '../../../common/domain/domain-error.js';

export class EmployeeNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Employee with id "${id}" not found`);
  }
}
