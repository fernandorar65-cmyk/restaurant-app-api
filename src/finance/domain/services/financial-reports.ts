import type { PaymentMethod } from '../../../common/domain/payment-method.enum.js';
import { Money } from '../../../common/domain/value-objects/money.js';

export interface DayActivity {
  businessDate: string;
  opened: number;
  closed: number;
  cancelled: number;
}

export interface DaySales {
  businessDate: string;
  method: PaymentMethod;
  gross: number;
  refunded: number;
}

export interface DayExpenses {
  businessDate: string;
  total: number;
}

/** One day of the series; figures mean the same as in the daily closure. */
export interface DailyFinancials {
  businessDate: string;
  openedAttentions: number;
  closedAttentions: number;
  cancelledAttentions: number;
  grossSales: number;
  refundedAmount: number;
  /** Gross minus refunds. */
  netSales: number;
  expenseAmount: number;
  /** Net sales minus expenses (no food or labour cost yet). */
  profit: number;
  /** Net sales per closed attention; 0 without closed attentions. */
  averageTicket: number;
  /** Net collected per payment method. */
  byMethod: { method: PaymentMethod; amount: number }[];
}

export type PeriodTotals = Omit<DailyFinancials, 'businessDate'>;

/** Every day of the range, with zeros on days without activity. */
export function buildDailySeries(
  days: string[],
  data: { activity: DayActivity[]; sales: DaySales[]; expenses: DayExpenses[] },
): DailyFinancials[] {
  return days.map((businessDate) =>
    figures({
      businessDate,
      activity: data.activity.filter(
        (row) => row.businessDate === businessDate,
      ),
      sales: data.sales.filter((row) => row.businessDate === businessDate),
      expenses: data.expenses.filter(
        (row) => row.businessDate === businessDate,
      ),
    }),
  );
}

/** The whole period at once (its average ticket is not the average of the days'). */
export function summarizePeriod(series: DailyFinancials[]): PeriodTotals {
  const count = (pick: (day: DailyFinancials) => number) =>
    series.reduce((total, day) => total + pick(day), 0);
  const closed = count((day) => day.closedAttentions);
  const grossSales = sum(series.map((day) => day.grossSales));
  const refundedAmount = sum(series.map((day) => day.refundedAmount));
  const netSales = Money.of(grossSales).minus(Money.of(refundedAmount)).amount;
  const expenseAmount = sum(series.map((day) => day.expenseAmount));
  return {
    openedAttentions: count((day) => day.openedAttentions),
    closedAttentions: closed,
    cancelledAttentions: count((day) => day.cancelledAttentions),
    grossSales,
    refundedAmount,
    netSales,
    expenseAmount,
    profit: Money.of(netSales).minus(Money.of(expenseAmount)).amount,
    averageTicket: averageTicket(netSales, closed),
    byMethod: mergeByMethod(series.flatMap((day) => day.byMethod)),
  };
}

function figures(params: {
  businessDate: string;
  activity: DayActivity[];
  sales: DaySales[];
  expenses: DayExpenses[];
}): DailyFinancials {
  const closed = params.activity.reduce((count, row) => count + row.closed, 0);
  const grossSales = sum(params.sales.map((row) => row.gross));
  const refundedAmount = sum(params.sales.map((row) => row.refunded));
  const netSales = Money.of(grossSales).minus(Money.of(refundedAmount)).amount;
  const expenseAmount = sum(params.expenses.map((row) => row.total));
  return {
    businessDate: params.businessDate,
    openedAttentions: params.activity.reduce(
      (count, row) => count + row.opened,
      0,
    ),
    closedAttentions: closed,
    cancelledAttentions: params.activity.reduce(
      (count, row) => count + row.cancelled,
      0,
    ),
    grossSales,
    refundedAmount,
    netSales,
    expenseAmount,
    profit: Money.of(netSales).minus(Money.of(expenseAmount)).amount,
    averageTicket: averageTicket(netSales, closed),
    byMethod: mergeByMethod(
      params.sales.map((row) => ({
        method: row.method,
        amount: Money.of(row.gross).minus(Money.of(row.refunded)).amount,
      })),
    ),
  };
}

function averageTicket(netSales: number, closedAttentions: number): number {
  return closedAttentions > 0
    ? Money.of(netSales).times(1 / closedAttentions).amount
    : 0;
}

function mergeByMethod(
  rows: { method: PaymentMethod; amount: number }[],
): { method: PaymentMethod; amount: number }[] {
  const byMethod = new Map<PaymentMethod, Money>();
  for (const row of rows) {
    byMethod.set(
      row.method,
      (byMethod.get(row.method) ?? Money.ZERO).plus(Money.of(row.amount)),
    );
  }
  return [...byMethod]
    .map(([method, amount]) => ({ method, amount: amount.amount }))
    .sort((a, b) => a.method.localeCompare(b.method));
}

function sum(amounts: number[]): number {
  return Money.sum(amounts.map((amount) => Money.of(amount))).amount;
}
