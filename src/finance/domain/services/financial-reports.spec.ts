import { PaymentMethod } from '../../../common/domain/payment-method.enum.js';
import { buildDailySeries, summarizePeriod } from './financial-reports.js';

const days = ['2026-10-01', '2026-10-02', '2026-10-03'];

const series = buildDailySeries(days, {
  activity: [
    { businessDate: '2026-10-01', opened: 3, closed: 2, cancelled: 1 },
    { businessDate: '2026-10-03', opened: 1, closed: 1, cancelled: 0 },
  ],
  sales: [
    {
      businessDate: '2026-10-01',
      method: PaymentMethod.CASH,
      gross: 60.1,
      refunded: 0,
    },
    {
      businessDate: '2026-10-01',
      method: PaymentMethod.CARD,
      gross: 40.2,
      refunded: 10,
    },
    {
      businessDate: '2026-10-03',
      method: PaymentMethod.CASH,
      gross: 33.33,
      refunded: 0,
    },
  ],
  expenses: [{ businessDate: '2026-10-01', total: 20 }],
});

describe('buildDailySeries', () => {
  it('fills every day of the range, with zeros when nothing happened', () => {
    expect(series.map((day) => day.businessDate)).toEqual(days);
    expect(series[1]).toMatchObject({
      closedAttentions: 0,
      netSales: 0,
      profit: 0,
      averageTicket: 0,
      byMethod: [],
    });
  });

  it('computes net sales, profit, ticket and net per method of a day', () => {
    expect(series[0]).toMatchObject({
      openedAttentions: 3,
      closedAttentions: 2,
      cancelledAttentions: 1,
      grossSales: 100.3,
      refundedAmount: 10,
      netSales: 90.3,
      expenseAmount: 20,
      profit: 70.3,
      averageTicket: 45.15,
      byMethod: [
        { method: PaymentMethod.CARD, amount: 30.2 },
        { method: PaymentMethod.CASH, amount: 60.1 },
      ],
    });
  });
});

describe('summarizePeriod', () => {
  it('adds the days up and averages the ticket over the whole period', () => {
    expect(summarizePeriod(series)).toEqual({
      openedAttentions: 4,
      closedAttentions: 3,
      cancelledAttentions: 1,
      grossSales: 133.63,
      refundedAmount: 10,
      netSales: 123.63,
      expenseAmount: 20,
      profit: 103.63,
      averageTicket: 41.21,
      byMethod: [
        { method: PaymentMethod.CARD, amount: 30.2 },
        { method: PaymentMethod.CASH, amount: 93.43 },
      ],
    });
  });
});
