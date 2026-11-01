import { PaymentMethod } from '../../../common/domain/payment-method.enum.js';
import { AllocationConcept } from '../enums/allocation-concept.enum.js';
import { AllocationMode } from '../enums/allocation-mode.enum.js';
import { PaymentStatusCode } from '../enums/payment-status-code.enum.js';
import {
  InvalidPaymentAmountError,
  InvalidPaymentTransitionError,
} from '../exceptions/payment.errors.js';
import { Payment, type PaymentAllocation } from './payment.entity.js';

const {
  PENDING,
  PROCESSING,
  PAID,
  FAILED,
  CANCELLED,
  PARTIALLY_REFUNDED,
  REFUNDED,
} = PaymentStatusCode;

type NewAllocation = Omit<PaymentAllocation, 'createdAt'>;

function itemAllocation(id: string, amount: number): NewAllocation {
  return {
    id: `allocation-${id}`,
    concept: AllocationConcept.ORDER_ITEM,
    orderItemId: id,
    fulfillmentId: null,
    amount,
  };
}

function createPayment(
  overrides: {
    status?: PaymentStatusCode;
    amount?: number;
    allocations?: NewAllocation[];
    provider?: {
      code: string;
      paymentId: string | null;
      status: string | null;
    };
  } = {},
): Payment {
  return Payment.create({
    id: 'payment-1',
    organizationId: 'org-1',
    restaurantId: 'r1',
    attentionId: 'attention-1',
    status: overrides.status ?? PENDING,
    method: PaymentMethod.CASH,
    mode: AllocationMode.ITEMS,
    amount: overrides.amount ?? 30.3,
    currencyCode: 'PEN',
    payerUserId: null,
    payerName: 'Ana',
    externalReference: null,
    provider: overrides.provider ?? null,
    requestId: 'request-1',
    notes: null,
    registeredByUserId: 'cashier-1',
    allocations: overrides.allocations ?? [
      itemAllocation('item-1', 10.1),
      itemAllocation('item-2', 20.2),
    ],
  });
}

/** Reaches the given status through valid transitions. */
function paymentIn(status: PaymentStatusCode): Payment {
  const path: Record<PaymentStatusCode, PaymentStatusCode[]> = {
    [PENDING]: [],
    [PROCESSING]: [PROCESSING],
    [PAID]: [PAID],
    [FAILED]: [FAILED],
    [CANCELLED]: [CANCELLED],
    [PARTIALLY_REFUNDED]: [PAID, PARTIALLY_REFUNDED],
    [REFUNDED]: [PAID, REFUNDED],
  };
  const payment = createPayment();
  for (const step of path[status]) {
    payment.changeStatus(step);
  }
  return payment;
}

describe('Payment', () => {
  describe('create', () => {
    it('stamps every allocation and leaves a pending payment unpaid', () => {
      const payment = createPayment();
      expect(payment.status).toBe(PENDING);
      expect(payment.amount).toBe(30.3);
      expect(payment.paidAt).toBeNull();
      expect(payment.allocations).toHaveLength(2);
      for (const allocation of payment.allocations) {
        expect(allocation.createdAt).toBeInstanceOf(Date);
      }
    });

    it('stamps paidAt when created already PAID (e.g. cash)', () => {
      const payment = createPayment({ status: PAID });
      expect(payment.paidAt).toBeInstanceOf(Date);
    });

    it('accepts allocations whose float sum is off but whose cents match', () => {
      // 0.1 + 0.2 !== 0.3 in floating point; the comparison is in cents.
      const payment = createPayment({
        amount: 0.3,
        allocations: [itemAllocation('a', 0.1), itemAllocation('b', 0.2)],
      });
      expect(payment.amount).toBe(0.3);
    });

    it('accepts a delivery fee allocation', () => {
      const payment = createPayment({
        amount: 15,
        allocations: [
          itemAllocation('a', 10),
          {
            id: 'allocation-fee',
            concept: AllocationConcept.DELIVERY_FEE,
            orderItemId: null,
            fulfillmentId: 'fulfillment-1',
            amount: 5,
          },
        ],
      });
      expect(payment.allocations.map((a) => a.concept)).toEqual([
        AllocationConcept.ORDER_ITEM,
        AllocationConcept.DELIVERY_FEE,
      ]);
    });

    it('requires at least one allocation', () => {
      expect(() => createPayment({ allocations: [] })).toThrow(
        InvalidPaymentAmountError,
      );
    });

    it.each([0, -5])('rejects an amount of %s', (amount) => {
      expect(() =>
        createPayment({ amount, allocations: [itemAllocation('a', amount)] }),
      ).toThrow(InvalidPaymentAmountError);
    });

    it('rejects allocations that do not add up to the amount', () => {
      expect(() =>
        createPayment({
          amount: 30,
          allocations: [itemAllocation('a', 10), itemAllocation('b', 19.99)],
        }),
      ).toThrow(InvalidPaymentAmountError);
    });
  });

  describe('changeStatus', () => {
    it.each([
      [PENDING, PROCESSING],
      [PENDING, PAID],
      [PENDING, FAILED],
      [PENDING, CANCELLED],
      [PROCESSING, PAID],
      [PROCESSING, FAILED],
      [PROCESSING, CANCELLED],
      [PAID, PARTIALLY_REFUNDED],
      [PAID, REFUNDED],
      [PARTIALLY_REFUNDED, REFUNDED],
    ])('allows %s -> %s', (from, to) => {
      const payment = paymentIn(from);
      expect(payment.canMoveTo(to)).toBe(true);
      expect(payment.changeStatus(to)).toBe(true);
      expect(payment.status).toBe(to);
    });

    it.each([
      [PROCESSING, PENDING],
      [PAID, PENDING],
      [PAID, CANCELLED],
      [PAID, FAILED],
      [FAILED, PAID],
      [CANCELLED, PAID],
      [REFUNDED, PAID],
      [PARTIALLY_REFUNDED, PAID],
      [PENDING, REFUNDED],
    ])('forbids %s -> %s', (from, to) => {
      const payment = paymentIn(from);
      expect(payment.canMoveTo(to)).toBe(false);
      expect(() => payment.changeStatus(to)).toThrow(
        InvalidPaymentTransitionError,
      );
      expect(payment.status).toBe(from);
    });

    it('treats a repeated status as a harmless no-op', () => {
      const payment = paymentIn(PAID);
      const paidAt = payment.paidAt;
      expect(payment.canMoveTo(PAID)).toBe(true);
      expect(payment.changeStatus(PAID)).toBe(false);
      expect(payment.paidAt).toBe(paidAt);
    });

    it('stamps paidAt when confirmed and keeps it afterwards', () => {
      const payment = paymentIn(PROCESSING);
      expect(payment.paidAt).toBeNull();
      payment.changeStatus(PAID);
      const paidAt = payment.paidAt;
      expect(paidAt).toBeInstanceOf(Date);
      payment.changeStatus(REFUNDED);
      expect(payment.paidAt).toBe(paidAt);
    });

    it('does not stamp paidAt on failure', () => {
      const payment = paymentIn(FAILED);
      expect(payment.paidAt).toBeNull();
    });
  });

  describe('recordProviderStatus', () => {
    it('keeps the raw gateway status of a provider payment', () => {
      const payment = createPayment({
        provider: { code: 'IZIPAY', paymentId: 'ext-1', status: null },
      });
      payment.recordProviderStatus('AUTHORIZED');
      expect(payment.provider).toEqual({
        code: 'IZIPAY',
        paymentId: 'ext-1',
        status: 'AUTHORIZED',
      });
      expect(payment.status).toBe(PENDING);
    });

    it('ignores it for manual payments', () => {
      const payment = createPayment();
      payment.recordProviderStatus('AUTHORIZED');
      expect(payment.provider).toBeNull();
    });
  });
});
