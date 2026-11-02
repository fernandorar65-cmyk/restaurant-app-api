import { ValidationDomainError } from '../domain-error.js';
import { BusinessDate } from './business-date.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Inclusive range of business dates, e.g. the period of a report. */
export class BusinessDateRange {
  private constructor(
    readonly from: BusinessDate,
    readonly to: BusinessDate,
  ) {}

  static create(from: string, to: string, maxDays: number): BusinessDateRange {
    const range = new BusinessDateRange(
      BusinessDate.create(from),
      BusinessDate.create(to),
    );
    if (range.from.isAfter(range.to)) {
      throw new ValidationDomainError('"from" no puede ser posterior a "to"');
    }
    if (range.length > maxDays) {
      throw new ValidationDomainError(
        `El periodo no puede superar ${maxDays} días`,
      );
    }
    return range;
  }

  /** Number of days, both ends included. */
  get length(): number {
    return (
      (Date.parse(`${this.to.value}T00:00:00Z`) -
        Date.parse(`${this.from.value}T00:00:00Z`)) /
        DAY_MS +
      1
    );
  }

  /** Every date of the range, oldest first. */
  days(): string[] {
    const start = Date.parse(`${this.from.value}T00:00:00Z`);
    return Array.from({ length: this.length }, (_, index) =>
      new Date(start + index * DAY_MS).toISOString().slice(0, 10),
    );
  }
}
