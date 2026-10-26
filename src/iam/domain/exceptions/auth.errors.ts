import {
  ForbiddenDomainError,
  UnauthorizedDomainError,
} from '../../../common/domain/domain-error.js';

export class InvalidCredentialsError extends UnauthorizedDomainError {
  constructor() {
    super('Correo o contraseña incorrectos');
  }
}

export class InvalidRefreshTokenError extends UnauthorizedDomainError {
  constructor() {
    super('Refresh token inválido o vencido');
  }
}

export class InvalidPasswordResetTokenError extends UnauthorizedDomainError {
  constructor() {
    super('Token de restablecimiento inválido o vencido');
  }
}

export class AccountDisabledError extends ForbiddenDomainError {
  constructor() {
    super('La cuenta está inactiva o bloqueada');
  }
}

export class PlatformAdminRequiredError extends ForbiddenDomainError {
  constructor() {
    super('Esta operación es exclusiva de los administradores de ACMR');
  }
}
