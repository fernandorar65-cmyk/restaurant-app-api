import { ValidationDomainError } from '../domain-error.js';

export const DEFAULT_CURRENCY_CODE = 'PEN';

/** ISO 4217 alphabetic code, e.g. PEN, USD. */
export class CurrencyCode {
  private constructor(readonly value: string) {}

  /**
   * Rebuilds a value read from the database without validating it again, so a
   * legacy row that predates the current rules never breaks a read.
   */
  static rehydrate(value: string): CurrencyCode {
    return new CurrencyCode(value);
  }

  static create(raw: string): CurrencyCode {
    const normalized = raw.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new ValidationDomainError(
        `"${raw}" no es un código de moneda ISO 4217 válido`,
      );
    }
    return new CurrencyCode(normalized);
  }
}
