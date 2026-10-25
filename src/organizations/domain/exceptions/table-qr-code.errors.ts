import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class TableQrCodeNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Table QR code with id "${id}" not found`);
  }
}

export class DuplicateTableQrCodeError extends ConflictDomainError {
  constructor() {
    super('This dining table already has a QR code assigned');
  }
}
