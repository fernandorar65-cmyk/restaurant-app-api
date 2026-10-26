import {
  BusinessRuleDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class TableQrCodeNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el QR con id "${id}"`);
  }
}

export class TableQrCodeAlreadyRevokedError extends BusinessRuleDomainError {
  constructor(id: string) {
    super(`El QR "${id}" ya está revocado`);
  }
}

export class InactiveDiningTableError extends BusinessRuleDomainError {
  constructor(id: string) {
    super(`La mesa "${id}" no está activa`);
  }
}
