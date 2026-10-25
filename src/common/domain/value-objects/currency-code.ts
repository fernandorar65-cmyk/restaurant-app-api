import { ValidationDomainError } from '../domain-error.js';

export const DEFAULT_CURRENCY_CODE = 'PEN';

/** ISO 4217 alphabetic code, e.g. PEN, USD. */
export class CurrencyCode {
  private constructor(readonly value: string) {}

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
