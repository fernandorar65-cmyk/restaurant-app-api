import {
  ForbiddenDomainError,
  UnauthorizedDomainError,
} from '../../../common/domain/domain-error.js';

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

export class AccountDisabledError extends ForbiddenDomainError {
  constructor() {
    super('This account is inactive or blocked');
  }
}
