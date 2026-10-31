import { NotFoundDomainError } from '../../../common/domain/domain-error.js';

export class ErrorLogNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el registro de error con id "${id}"`);
  }
}
