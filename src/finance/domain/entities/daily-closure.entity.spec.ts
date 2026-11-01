import { PaymentMethod } from '../../../common/domain/payment-method.enum.js';
import { DailyClosure, type DailyFigures } from './daily-closure.entity.js';

function figures(overrides: Partial<DailyFigures> = {}): DailyFigures {
  return {
    openedAttentions: 12,
    closedAttentions: 10,
    cancelledAttentions: 1,
    grossSales: 1250.3,
    refundedAmount: 50.1,
    expenseAmount: 80,
    cashExpenseAmount: 30.2,
    paymentTotals: [
      { method: PaymentMethod.CASH, amount: 400.5 },
      { method: PaymentMethod.CARD, amount: 799.7 },
    ],
    ...overrides,
  };
}

function close(
  dailyFigures: DailyFigures,
  actualCash?: number | null,
): DailyClosure {
  return DailyClosure.close({
    id: 'closure-1',
    restaurantId: 'r1',
    businessDate: '2026-10-31',
    figures: dailyFigures,
    actualCash,
    closedByUserId: 'manager-1',
  });
}

describe('DailyClosure', () => {
  describe('compute', () => {
    it('nets refunds and subtracts cash expenses from cash collected', () => {
      expect(DailyClosure.compute(figures())).toEqual({
        netSales: 1200.2,
        expectedCash: 370.3,
      });
    });

    it('expects no cash when nothing was collected in cash', () => {
      const result = DailyClosure.compute(
        figures({
          cashExpenseAmount: 0,
          paymentTotals: [{ method: PaymentMethod.YAPE, amount: 100 }],
        }),
      );
      expect(result.expectedCash).toBe(0);
    });

    it('never expects negative cash', () => {
      const result = DailyClosure.compute(
        figures({
          cashExpenseAmount: 500,
          paymentTotals: [{ method: PaymentMethod.CASH, amount: 100 }],
        }),
      );
      expect(result.expectedCash).toBe(0);
    });

    it('keeps cents exact (0.3 - 0.1 = 0.2)', () => {
      const result = DailyClosure.compute(
        figures({
          grossSales: 0.3,
          refundedAmount: 0.1,
          cashExpenseAmount: 0.1,
          paymentTotals: [{ method: PaymentMethod.CASH, amount: 0.3 }],
        }),
      );
      expect(result).toEqual({ netSales: 0.2, expectedCash: 0.2 });
    });
  });

  describe('close', () => {
    it('snapshots the figures of the day', () => {
      const closure = close(figures(), 365.3);
      expect(closure.businessDate).toBe('2026-10-31');
      expect(closure.openedAttentions).toBe(12);
      expect(closure.closedAttentions).toBe(10);
      expect(closure.cancelledAttentions).toBe(1);
      expect(closure.grossSales).toBe(1250.3);
      expect(closure.refundedAmount).toBe(50.1);
      expect(closure.netSales).toBe(1200.2);
      expect(closure.expenseAmount).toBe(80);
      expect(closure.expectedCash).toBe(370.3);
      expect(closure.actualCash).toBe(365.3);
      expect(closure.differenceAmount).toBe(-5);
      expect(closure.closedByUserId).toBe('manager-1');
      expect(closure.closedAt).toBeInstanceOf(Date);
      expect(closure.paymentTotals).toHaveLength(2);
    });

    it('records a surplus as a positive difference', () => {
      expect(close(figures(), 371.4).differenceAmount).toBe(1.1);
    });

    it('leaves the difference empty when the cash was not counted', () => {
      const closure = close(figures());
      expect(closure.actualCash).toBeNull();
      expect(closure.differenceAmount).toBeNull();
      expect(closure.notes).toBeNull();
    });

    it('does not expose its payment totals for mutation', () => {
      const closure = close(figures());
      closure.paymentTotals.push({ method: PaymentMethod.PLIN, amount: 1 });
      expect(closure.paymentTotals).toHaveLength(2);
    });
  });
});
