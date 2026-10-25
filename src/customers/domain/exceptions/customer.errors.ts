import {
  ConflictDomainError,
  NotFoundDomainError,
  UnauthorizedDomainError,
} from '../../../common/domain/domain-error.js';

export class CustomerNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Customer with id "${id}" not found`);
  }
}

export class DuplicateCustomerEmailError extends ConflictDomainError {
  constructor(email: string) {
    super(`A customer with email "${email}" already exists`);
  }
}

export class InvalidCredentialsError extends UnauthorizedDomainError {
  constructor() {
    super('Invalid email or password');
  }
}

export class InvalidRefreshTokenError extends UnauthorizedDomainError {
  constructor() {
    super('Invalid or expired refresh token');
  }
}

export class InvalidPasswordResetTokenError extends UnauthorizedDomainError {
  constructor() {
    super('Invalid or expired password reset token');
  }
}
