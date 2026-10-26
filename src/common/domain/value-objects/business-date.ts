import { ValidationDomainError } from '../domain-error.js';

/** Calendar date without time ('YYYY-MM-DD'), e.g. the business day of a closure. */
export class BusinessDate {
  private constructor(readonly value: string) {}

  static create(raw: string): BusinessDate {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    const date = match ? new Date(`${raw}T00:00:00Z`) : null;
    if (!date || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
      throw new ValidationDomainError(`"${raw}" no es una fecha válida (YYYY-MM-DD)`);
    }
    return new BusinessDate(raw);
  }

  /** Today's date as seen in the given IANA time zone. */
  static today(timeZone: string): BusinessDate {
    return new BusinessDate(
      new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date()),
    );
  }

  isAfter(other: BusinessDate): boolean {
    return this.value > other.value;
  }
}
