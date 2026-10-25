import { ValidationDomainError } from '../domain-error.js';

export const DEFAULT_TIME_ZONE = 'America/Lima';

/** IANA time zone name, e.g. America/Lima. */
export class TimeZone {
  private constructor(readonly value: string) {}

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
