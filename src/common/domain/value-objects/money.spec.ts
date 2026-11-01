import { describe, expect, it } from 'vitest';
import { ValidationDomainError } from '../domain-error.js';
import { Money } from './money.js';

describe('Money', () => {
  it('adds and subtracts without floating-point drift', () => {
    expect(Money.of(0.1).plus(Money.of(0.2)).amount).toBe(0.3);
    expect(Money.of(30.3).minus(Money.of(20.1)).amount).toBe(10.2);
    const total = Money.sum([Money.of(10.1), Money.of(10.1), Money.of(10.1)]);
    expect(total.amount).toBe(30.3);
    expect(total.cents).toBe(3030);
  });

  it('rounds to cents half away from zero', () => {
    expect(Money.of(1.005).cents).toBe(101);
    expect(Money.of(2.675).amount).toBe(2.68);
    expect(Money.of(-1.005).cents).toBe(-101);
    expect(Money.of(19.999).amount).toBe(20);
  });

  it('multiplies by a quantity and rounds the result', () => {
    expect(Money.of(10.1).times(3).amount).toBe(30.3);
    expect(Money.of(0.07).times(3).amount).toBe(0.21);
    expect(Money.of(9.99).times(0.5).amount).toBe(5);
  });

  it('parses NUMERIC values from the database, treating null as zero', () => {
    expect(Money.parse('12.50').amount).toBe(12.5);
    expect(Money.parse(null).isZero()).toBe(true);
    expect(Money.parse(undefined).isZero()).toBe(true);
    expect(Money.parse('').isZero()).toBe(true);
  });

  it('compares, clamps and picks the smaller amount', () => {
    const five = Money.of(5);
    const three = Money.of(3);
    expect(five.greaterThan(three)).toBe(true);
    expect(three.lessThan(five)).toBe(true);
    expect(five.equals(Money.of(5.001))).toBe(true);
    expect(three.minus(five).isNegative()).toBe(true);
    expect(three.minus(five).atLeastZero().isZero()).toBe(true);
    expect(five.min(three)).toBe(three);
    expect(five.isPositive()).toBe(true);
  });

  it('rejects non-finite amounts and fractional cents', () => {
    expect(() => Money.of(Number.NaN)).toThrow(ValidationDomainError);
    expect(() => Money.of(Number.POSITIVE_INFINITY)).toThrow(
      ValidationDomainError,
    );
    expect(() => Money.fromCents(1.5)).toThrow(ValidationDomainError);
  });
});
