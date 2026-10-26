import { PaymentMethod } from '../../../common/domain/payment-method.enum.js';
import { Payment } from '../entities/payment.entity.js';
import { AllocationConcept } from '../enums/allocation-concept.enum.js';
import { AllocationMode } from '../enums/allocation-mode.enum.js';
import { PaymentStatusCode } from '../enums/payment-status-code.enum.js';
import {
  AllocationExceedsItemBalanceError,
  AllocationTargetNotInAttentionError,
  DuplicateAllocationTargetError,
  InvalidPaymentAmountError,
  InvalidPaymentTransitionError,
  NothingToPayError,
  PaymentExceedsBalanceError,
} from '../exceptions/payment.errors.js';
import { planAllocations } from './allocation-planner.js';
import type { ChargeLine } from './allocation-planner.js';

const at = (minute: number) => new Date(Date.UTC(2026, 9, 26, 12, minute));
const item = (orderItemId: string, outstanding: number, minute: number): ChargeLine => ({
  concept: AllocationConcept.ORDER_ITEM,
  orderItemId,
  label: orderItemId,
  outstanding,
  createdAt: at(minute),
});

// The example of the specification: Lomo S/40, Causa S/20, Chicha S/10.
const LINES = [item('chicha', 10, 3), item('lomo', 40, 1), item('causa', 20, 2)];

describe('planAllocations', () => {
  it('pays chosen products with chosen amounts (S/45 = lomo + half chicha)', () => {
    const plan = planAllocations(LINES, {
      mode: AllocationMode.ITEMS,
      allocations: [
        { orderItemId: 'lomo', amount: 40 },
        { orderItemId: 'chicha', amount: 5 },
      ],
    });
    expect(plan.map((line) => [line.orderItemId, line.amount])).toEqual([
      ['lomo', 40],
      ['chicha', 5],
    ]);
  });

  it('distributes the full balance in creation order, delivery fee last', () => {
    const plan = planAllocations(
      [
        ...LINES,
        {
          concept: AllocationConcept.DELIVERY_FEE,
          orderItemId: null,
          label: 'envío',
          outstanding: 5,
          createdAt: at(0),
        },
      ],
      { mode: AllocationMode.FULL },
    );
    expect(plan.map((line) => line.orderItemId ?? line.concept)).toEqual([
      'lomo',
      'causa',
      'chicha',
      AllocationConcept.DELIVERY_FEE,
    ]);
    expect(plan.reduce((sum, line) => sum + line.amount, 0)).toBe(75);
  });

  it('spreads a free amount deterministically, breaking date ties by id', () => {
    const plan = planAllocations([item('b', 10, 1), item('a', 10, 1), item('c', 10, 0)], {
      mode: AllocationMode.AMOUNT,
      amount: 15.5,
    });
    expect(plan.map((line) => [line.orderItemId, line.amount])).toEqual([
      ['c', 10],
      ['a', 5.5],
    ]);
  });

  it('keeps cents exact', () => {
    const plan = planAllocations([item('a', 0.1, 1), item('b', 0.2, 2)], {
      mode: AllocationMode.AMOUNT,
      amount: 0.3,
    });
    expect(plan.map((line) => line.amount)).toEqual([0.1, 0.2]);
  });

  it('never collects more than what is owed', () => {
    expect(() =>
      planAllocations(LINES, { mode: AllocationMode.AMOUNT, amount: 70.01 }),
    ).toThrow(PaymentExceedsBalanceError);
    expect(() =>
      planAllocations(LINES, {
        mode: AllocationMode.ITEMS,
        allocations: [{ orderItemId: 'chicha', amount: 10.01 }],
      }),
    ).toThrow(AllocationExceedsItemBalanceError);
    expect(() =>
      planAllocations([item('a', 0, 1)], { mode: AllocationMode.FULL }),
    ).toThrow(NothingToPayError);
  });

  it('rejects products of another attention, duplicates and empty amounts', () => {
    expect(() =>
      planAllocations(LINES, {
        mode: AllocationMode.ITEMS,
        allocations: [{ orderItemId: 'other', amount: 1 }],
      }),
    ).toThrow(AllocationTargetNotInAttentionError);
    expect(() =>
      planAllocations(LINES, {
        mode: AllocationMode.ITEMS,
        allocations: [
          { orderItemId: 'lomo', amount: 1 },
          { orderItemId: 'lomo', amount: 1 },
        ],
      }),
    ).toThrow(DuplicateAllocationTargetError);
    expect(() =>
      planAllocations(LINES, { mode: AllocationMode.ITEMS, allocations: [] }),
    ).toThrow(InvalidPaymentAmountError);
  });
});

describe('Payment', () => {
  const base = {
    id: 'payment-1',
    organizationId: 'org',
    restaurantId: 'restaurant',
    attentionId: 'attention',
    method: PaymentMethod.CARD,
    mode: AllocationMode.ITEMS,
    currencyCode: 'PEN',
    payerUserId: null,
    payerName: null,
    externalReference: null,
    provider: { code: 'stripe', paymentId: 'pi_1', status: null },
    requestId: 'request-1',
    notes: null,
    registeredByUserId: null,
    allocations: [
      { id: 'a1', concept: AllocationConcept.ORDER_ITEM, orderItemId: 'lomo', amount: 40 },
      { id: 'a2', concept: AllocationConcept.ORDER_ITEM, orderItemId: 'chicha', amount: 5 },
    ],
  };

  it('requires its allocations to add up to the amount', () => {
    expect(() =>
      Payment.create({ ...base, status: PaymentStatusCode.PAID, amount: 44 }),
    ).toThrow(InvalidPaymentAmountError);
  });

  it('is paid on creation only when its status counts toward the balance', () => {
    const manual = Payment.create({ ...base, status: PaymentStatusCode.PAID, amount: 45 });
    const pending = Payment.create({ ...base, status: PaymentStatusCode.PENDING, amount: 45 });
    expect(manual.paidAt).toBeInstanceOf(Date);
    expect(pending.paidAt).toBeNull();
  });

  it('applies gateway statuses idempotently and never goes back', () => {
    const payment = Payment.create({ ...base, status: PaymentStatusCode.PENDING, amount: 45 });
    expect(payment.changeStatus(PaymentStatusCode.PROCESSING)).toBe(true);
    expect(payment.changeStatus(PaymentStatusCode.PAID)).toBe(true);
    expect(payment.paidAt).toBeInstanceOf(Date);
    // A repeated webhook changes nothing.
    expect(payment.changeStatus(PaymentStatusCode.PAID)).toBe(false);
    // A late "pending" can't undo a confirmed payment.
    expect(payment.canMoveTo(PaymentStatusCode.PENDING)).toBe(false);
    expect(() => payment.changeStatus(PaymentStatusCode.FAILED)).toThrow(
      InvalidPaymentTransitionError,
    );
    expect(payment.amount).toBe(45);
  });
});
