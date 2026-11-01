import { Money } from '../../../common/domain/value-objects/money.js';
import { AllocationConcept } from '../enums/allocation-concept.enum.js';
import { AllocationMode } from '../enums/allocation-mode.enum.js';
import { InvalidPaymentAmountError } from '../exceptions/payment.errors.js';
import type { AllocationTotals } from '../repositories/payment.repository.js';
import { sortChargeLines } from './allocation-planner.js';
import type {
  AllocationRequest,
  ChargeLine,
  RequestedAllocation,
} from './allocation-planner.js';

/** What an attention owes, as payments sees it. */
export interface BillToCharge {
  /** Billable products only. */
  items: {
    orderItemId: string;
    productName: string;
    subtotal: number;
    createdAt: Date;
  }[];
  /** Pickup/delivery record the fee belongs to; null when there is none. */
  fulfillmentId: string | null;
  deliveryFee: number;
}

export interface ChargeLineBalance {
  concept: AllocationConcept;
  orderItemId: string | null;
  label: string;
  total: number;
  /** Confirmed payments. */
  paid: number;
  /** Payments still pending at a gateway. */
  reserved: number;
  outstanding: number;
}

export interface BalanceSummary {
  total: number;
  paid: number;
  reserved: number;
  outstanding: number;
  lines: ChargeLineBalance[];
}

/** Billable products plus the delivery fee, minus what is already paid or in flight. */
export function buildChargeLines(
  bill: BillToCharge,
  totals: AllocationTotals[],
): ChargeLine[] {
  const lines: ChargeLine[] = bill.items.map((item) => {
    const allocated = totalsFor(
      totals,
      AllocationConcept.ORDER_ITEM,
      item.orderItemId,
    );
    return {
      concept: AllocationConcept.ORDER_ITEM,
      orderItemId: item.orderItemId,
      fulfillmentId: null,
      label: `"${item.productName}"`,
      outstanding: outstanding(item.subtotal, allocated),
      createdAt: item.createdAt,
    };
  });
  if (bill.deliveryFee > 0 && bill.fulfillmentId) {
    const allocated = totalsFor(totals, AllocationConcept.DELIVERY_FEE, null);
    lines.push({
      concept: AllocationConcept.DELIVERY_FEE,
      orderItemId: null,
      fulfillmentId: bill.fulfillmentId,
      label: 'el costo de envío',
      outstanding: outstanding(bill.deliveryFee, allocated),
      createdAt: new Date(8.64e15),
    });
  }
  return lines;
}

/** What is owed per product (and delivery fee): total, paid, reserved and outstanding. */
export function summarizeBalance(
  bill: BillToCharge,
  totals: AllocationTotals[],
): BalanceSummary {
  const lines = sortChargeLines(buildChargeLines(bill, totals)).map((line) => {
    const allocated = totalsFor(totals, line.concept, line.orderItemId);
    const total =
      line.concept === AllocationConcept.DELIVERY_FEE
        ? bill.deliveryFee
        : (bill.items.find((item) => item.orderItemId === line.orderItemId)
            ?.subtotal ?? 0);
    return {
      concept: line.concept,
      orderItemId: line.orderItemId,
      label: line.label,
      total,
      paid: allocated.counted,
      reserved: allocated.reserved,
      outstanding: line.outstanding,
    };
  });
  const sum = (pick: (line: ChargeLineBalance) => number) =>
    Money.sum(lines.map((line) => Money.of(pick(line)))).amount;
  return {
    total: sum((line) => line.total),
    paid: sum((line) => line.paid),
    reserved: sum((line) => line.reserved),
    outstanding: sum((line) => line.outstanding),
    lines,
  };
}

/** FULL and ITEMS amounts are computed by the server; AMOUNT needs the amount. */
export function allocationRequestFor(
  mode: AllocationMode,
  params: { amount?: number; allocations?: RequestedAllocation[] },
): AllocationRequest {
  switch (mode) {
    case AllocationMode.FULL:
      return { mode: AllocationMode.FULL };
    case AllocationMode.AMOUNT:
      if (params.amount === undefined) {
        throw new InvalidPaymentAmountError(
          'El modo AMOUNT requiere el monto a pagar',
        );
      }
      return { mode: AllocationMode.AMOUNT, amount: params.amount };
    case AllocationMode.ITEMS:
      return {
        mode: AllocationMode.ITEMS,
        allocations: params.allocations ?? [],
      };
  }
}

/** What is neither paid nor reserved yet; never negative. */
function outstanding(
  total: number,
  allocated: { counted: number; reserved: number },
): number {
  return Money.of(total)
    .minus(Money.of(allocated.counted))
    .minus(Money.of(allocated.reserved))
    .atLeastZero().amount;
}

function totalsFor(
  totals: AllocationTotals[],
  concept: AllocationConcept,
  orderItemId: string | null,
): { counted: number; reserved: number } {
  const row = totals.find(
    (candidate) =>
      candidate.concept === concept && candidate.orderItemId === orderItemId,
  );
  return { counted: row?.counted ?? 0, reserved: row?.reserved ?? 0 };
}
