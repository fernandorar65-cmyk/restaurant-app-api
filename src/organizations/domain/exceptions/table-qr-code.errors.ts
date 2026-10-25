import {
  BusinessRuleDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class TableQrCodeNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Table QR code with id "${id}" not found`);
  }
}

export class TableQrCodeAlreadyRevokedError extends BusinessRuleDomainError {
  constructor(id: string) {
    super(`Table QR code "${id}" is already revoked`);
  }
}

export class InactiveDiningTableError extends BusinessRuleDomainError {
  constructor(id: string) {
    super(`Dining table "${id}" is not active`);
  }
}
