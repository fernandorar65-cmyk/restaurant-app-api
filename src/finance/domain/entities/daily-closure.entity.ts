import { PaymentMethod } from '../../../common/domain/payment-method.enum.js';
import { roundMoney } from '../../../common/domain/value-objects/money.js';

export interface PaymentMethodTotal {
  method: PaymentMethod;
  /** Net collected with this method (payments minus refunds). */
  amount: number;
}

export interface DailyFigures {
  openedAttentions: number;
  closedAttentions: number;
  cancelledAttentions: number;
  grossSales: number;
  refundedAmount: number;
  expenseAmount: number;
  /** Expenses paid in cash (they leave the drawer). */
  cashExpenseAmount: number;
  paymentTotals: PaymentMethodTotal[];
}

export interface DailyClosureProps {
  id: string;
  restaurantId: string;
  businessDate: string;
  openedAttentions: number;
  closedAttentions: number;
  cancelledAttentions: number;
  grossSales: number;
  refundedAmount: number;
  netSales: number;
  expenseAmount: number;
  expectedCash: number;
  actualCash: number | null;
  differenceAmount: number | null;
  notes: string | null;
  closedByUserId: string;
  closedAt: Date;
  paymentTotals: PaymentMethodTotal[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Snapshot of a restaurant's business day at the moment it was closed. It is
 * immutable: later payments or expenses do not change a closure.
 */
export class DailyClosure {
  private constructor(private readonly props: DailyClosureProps) {}

  /**
   * Expected cash = cash collected - expenses paid in cash. It is never
   * negative (the drawer can't hold less than nothing); a shortfall shows up
   * in the difference against the counted cash.
   */
  static compute(figures: DailyFigures): {
    netSales: number;
    expectedCash: number;
  } {
    const cashCollected =
      figures.paymentTotals.find((total) => total.method === PaymentMethod.CASH)
        ?.amount ?? 0;
    return {
      netSales: roundMoney(figures.grossSales - figures.refundedAmount),
      expectedCash: Math.max(0, roundMoney(cashCollected - figures.cashExpenseAmount)),
    };
  }

  static close(params: {
    id: string;
    restaurantId: string;
    businessDate: string;
    figures: DailyFigures;
    actualCash?: number | null;
    notes?: string | null;
    closedByUserId: string;
  }): DailyClosure {
    const { netSales, expectedCash } = DailyClosure.compute(params.figures);
    const actualCash = params.actualCash ?? null;
    const now = new Date();
    return new DailyClosure({
      id: params.id,
      restaurantId: params.restaurantId,
      businessDate: params.businessDate,
      openedAttentions: params.figures.openedAttentions,
      closedAttentions: params.figures.closedAttentions,
      cancelledAttentions: params.figures.cancelledAttentions,
      grossSales: params.figures.grossSales,
      refundedAmount: params.figures.refundedAmount,
      netSales,
      expenseAmount: params.figures.expenseAmount,
      expectedCash,
      actualCash,
      differenceAmount: actualCash === null ? null : roundMoney(actualCash - expectedCash),
      notes: params.notes ?? null,
      closedByUserId: params.closedByUserId,
      closedAt: now,
      paymentTotals: params.figures.paymentTotals,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: DailyClosureProps): DailyClosure {
    return new DailyClosure(props);
  }

  get id(): string {
    return this.props.id;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get businessDate(): string {
    return this.props.businessDate;
  }
  get openedAttentions(): number {
    return this.props.openedAttentions;
  }
  get closedAttentions(): number {
    return this.props.closedAttentions;
  }
  get cancelledAttentions(): number {
    return this.props.cancelledAttentions;
  }
  get grossSales(): number {
    return this.props.grossSales;
  }
  get refundedAmount(): number {
    return this.props.refundedAmount;
  }
  get netSales(): number {
    return this.props.netSales;
  }
  get expenseAmount(): number {
    return this.props.expenseAmount;
  }
  get expectedCash(): number {
    return this.props.expectedCash;
  }
  get actualCash(): number | null {
    return this.props.actualCash;
  }
  get differenceAmount(): number | null {
    return this.props.differenceAmount;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get closedByUserId(): string {
    return this.props.closedByUserId;
  }
  get closedAt(): Date {
    return this.props.closedAt;
  }
  get paymentTotals(): PaymentMethodTotal[] {
    return [...this.props.paymentTotals];
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
