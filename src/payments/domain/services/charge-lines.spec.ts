import { describe, expect, it } from 'vitest';
import { AllocationConcept } from '../enums/allocation-concept.enum.js';
import { AllocationMode } from '../enums/allocation-mode.enum.js';
import { InvalidPaymentAmountError } from '../exceptions/payment.errors.js';
import type { AllocationTotals } from '../repositories/payment.repository.js';
import {
  allocationRequestFor,
  buildChargeLines,
  summarizeBalance,
} from './charge-lines.js';
import type { BillToCharge } from './charge-lines.js';

const bill: BillToCharge = {
  items: [
    {
      orderItemId: 'i2',
      productName: 'Ceviche',
      subtotal: 30,
      createdAt: new Date('2026-01-01T12:05:00Z'),
    },
    {
      orderItemId: 'i1',
      productName: 'Chicha',
      subtotal: 8.5,
      createdAt: new Date('2026-01-01T12:00:00Z'),
    },
  ],
  fulfillmentId: 'f1',
  deliveryFee: 5,
};

const totals: AllocationTotals[] = [
  {
    concept: AllocationConcept.ORDER_ITEM,
    orderItemId: 'i2',
    counted: 20,
    reserved: 4,
  },
  {
    concept: AllocationConcept.DELIVERY_FEE,
    orderItemId: null,
    counted: 5,
    reserved: 0,
  },
];

describe('buildChargeLines', () => {
  it('leaves outstanding what is neither paid nor reserved, delivery fee included', () => {
    const lines = buildChargeLines(bill, totals);

    expect(
      lines.map((line) => [line.concept, line.orderItemId, line.outstanding]),
    ).toEqual([
      [AllocationConcept.ORDER_ITEM, 'i2', 6],
      [AllocationConcept.ORDER_ITEM, 'i1', 8.5],
      [AllocationConcept.DELIVERY_FEE, null, 0],
    ]);
  });

  it('has no delivery line without a fee', () => {
    const lines = buildChargeLines({ ...bill, deliveryFee: 0 }, []);
    expect(lines.map((line) => line.concept)).not.toContain(
      AllocationConcept.DELIVERY_FEE,
    );
  });
});

describe('summarizeBalance', () => {
  it('sorts the lines (products by date, fee last) and adds them up', () => {
    const balance = summarizeBalance(bill, totals);

    expect(balance.lines.map((line) => line.orderItemId)).toEqual([
      'i1',
      'i2',
      null,
    ]);
    expect(balance).toMatchObject({
      total: 43.5,
      paid: 25,
      reserved: 4,
      outstanding: 14.5,
    });
  });
});

describe('allocationRequestFor', () => {
  it('requires the amount for AMOUNT', () => {
    expect(() => allocationRequestFor(AllocationMode.AMOUNT, {})).toThrow(
      InvalidPaymentAmountError,
    );
    expect(allocationRequestFor(AllocationMode.AMOUNT, { amount: 10 })).toEqual(
      { mode: AllocationMode.AMOUNT, amount: 10 },
    );
  });

  it('ignores amounts for FULL and defaults ITEMS to no allocations', () => {
    expect(allocationRequestFor(AllocationMode.FULL, { amount: 99 })).toEqual({
      mode: AllocationMode.FULL,
    });
    expect(allocationRequestFor(AllocationMode.ITEMS, {})).toEqual({
      mode: AllocationMode.ITEMS,
      allocations: [],
    });
  });
});
