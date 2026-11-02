import { ValidationDomainError } from '../domain-error.js';
import { BusinessDateRange } from './business-date-range.js';

describe('BusinessDateRange', () => {
  it('lists every day, both ends included, across months', () => {
    const range = BusinessDateRange.create('2026-02-27', '2026-03-02', 31);
    expect(range.length).toBe(4);
    expect(range.days()).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ]);
    expect(
      BusinessDateRange.create('2026-03-01', '2026-03-01', 1).days(),
    ).toEqual(['2026-03-01']);
  });

  it('rejects inverted, too long or malformed ranges', () => {
    expect(() =>
      BusinessDateRange.create('2026-03-02', '2026-03-01', 31),
    ).toThrow(ValidationDomainError);
    expect(() =>
      BusinessDateRange.create('2026-01-01', '2026-02-01', 31),
    ).toThrow(ValidationDomainError);
    expect(() =>
      BusinessDateRange.create('2026-02-30', '2026-03-01', 31),
    ).toThrow(ValidationDomainError);
  });
});
