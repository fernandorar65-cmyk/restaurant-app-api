import { ValidationDomainError } from '../domain-error.js';

/**
 * An amount of money kept as whole cents (the NUMERIC(12,2) columns), so sums
 * and differences never pick up floating-point errors (0.1 + 0.2 = 0.3).
 *
 * The currency is not part of it: every amount of an attention, a payment or
 * a daily closure is in its restaurant's currency, which travels next to it
 * (e.g. payments.currency_code) instead of inside each amount.
 */
export class Money {
  static readonly ZERO = new Money(0);

  private constructor(readonly cents: number) {}

  /** From a decimal amount, rounded to cents (half away from zero). */
  static of(amount: number): Money {
    if (!Number.isFinite(amount)) {
      throw new ValidationDomainError(`"${amount}" no es un monto válido`);
    }
    return new Money(roundHalfAwayFromZero(amount * 100));
  }

  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents)) {
      throw new ValidationDomainError(
        `"${cents}" no es una cantidad de céntimos`,
      );
    }
    return new Money(cents);
  }

  /** From a NUMERIC value as the database driver returns it; null is zero. */
  static parse(value: string | number | null | undefined): Money {
    return value === null || value === undefined || value === ''
      ? Money.ZERO
      : Money.of(Number(value));
  }

  static sum(amounts: Money[]): Money {
    return Money.fromCents(
      amounts.reduce((total, money) => total + money.cents, 0),
    );
  }

  /** Decimal amount, for persistence and responses. */
  get amount(): number {
    return this.cents / 100;
  }

  plus(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  minus(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  /** E.g. unit price × quantity. */
  times(factor: number): Money {
    if (!Number.isFinite(factor)) {
      throw new ValidationDomainError(`"${factor}" no es un factor válido`);
    }
    return new Money(roundHalfAwayFromZero(this.cents * factor));
  }

  /** Negative amounts become zero (e.g. nothing left to pay). */
  atLeastZero(): Money {
    return this.cents < 0 ? Money.ZERO : this;
  }

  min(other: Money): Money {
    return this.cents <= other.cents ? this : other;
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  isPositive(): boolean {
    return this.cents > 0;
  }

  isNegative(): boolean {
    return this.cents < 0;
  }

  greaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  lessThan(other: Money): boolean {
    return this.cents < other.cents;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}

/**
 * 1.005 * 100 is 100.49999999999999 in floating point; trimming to 15
 * significant digits first gives the 100.5 the user wrote, which then rounds
 * to 101.
 */
function roundHalfAwayFromZero(value: number): number {
  const exact = Number(Math.abs(value).toPrecision(15));
  return Math.sign(value) * Math.round(exact) || 0;
}
