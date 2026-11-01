import { ValidationDomainError } from '../domain-error.js';

export const DEFAULT_TIME_ZONE = 'America/Lima';

/** IANA time zone name, e.g. America/Lima. */
export class TimeZone {
  private constructor(readonly value: string) {}

  /**
   * Rebuilds a value read from the database without validating it again, so a
   * legacy row that predates the current rules never breaks a read.
   */
  static rehydrate(value: string): TimeZone {
    return new TimeZone(value);
  }

  static create(raw: string): TimeZone {
    const value = raw.trim();
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value });
    } catch {
      throw new ValidationDomainError(`"${raw}" no es una zona horaria válida`);
    }
    return new TimeZone(value);
  }
}
