import { ValidationDomainError } from '../domain-error.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(readonly value: string) {}

  /**
   * Rebuilds a value read from the database without validating it again, so a
   * legacy row that predates the current rules never breaks a read.
   */
  static rehydrate(value: string): Email {
    return new Email(value);
  }

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      throw new ValidationDomainError(`"${raw}" no es un correo válido`);
    }
    return new Email(normalized);
  }
}
