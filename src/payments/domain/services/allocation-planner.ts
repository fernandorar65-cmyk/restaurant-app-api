import { AllocationConcept } from '../enums/allocation-concept.enum.js';
import { AllocationMode } from '../enums/allocation-mode.enum.js';
import {
  AllocationExceedsItemBalanceError,
  AllocationTargetNotInAttentionError,
  DuplicateAllocationTargetError,
  InvalidPaymentAmountError,
  NothingToPayError,
  PaymentExceedsBalanceError,
} from '../exceptions/payment.errors.js';

/** Something the attention owes: a billable product or its delivery fee. */
export interface ChargeLine {
  concept: AllocationConcept;
  /** Null for the delivery fee. */
  orderItemId: string | null;
  label: string;
  /** What is still free to pay (total minus confirmed and in-flight payments). */
  outstanding: number;
  createdAt: Date;
}

export interface RequestedAllocation {
  /** Omitted to pay the delivery fee. */
  orderItemId?: string | null;
  amount: number;
}

export interface PlannedAllocation {
  concept: AllocationConcept;
  orderItemId: string | null;
  amount: number;
}

export type AllocationRequest =
  | { mode: AllocationMode.FULL }
  | { mode: AllocationMode.AMOUNT; amount: number }
  | { mode: AllocationMode.ITEMS; allocations: RequestedAllocation[] };

const toCents = (amount: number): number => Math.round(amount * 100);
const fromCents = (cents: number): number => cents / 100;

/**
 * Deterministic order for automatic distribution: products by creation
 * date, then id to break ties; the delivery fee goes last.
 */
export function sortChargeLines(lines: ChargeLine[]): ChargeLine[] {
  return [...lines].sort((a, b) => {
    if (a.concept !== b.concept) {
      return a.concept === AllocationConcept.DELIVERY_FEE ? 1 : -1;
    }
    const byDate = a.createdAt.getTime() - b.createdAt.getTime();
    if (byDate !== 0) {
      return byDate;
    }
    return (a.orderItemId ?? '').localeCompare(b.orderItemId ?? '');
  });
}

/**
 * Turns a payment request into allocations that never exceed what each
 * line still owes. Works in cents so the allocations always add up exactly
 * to the payment amount.
 */
export function planAllocations(
  lines: ChargeLine[],
  request: AllocationRequest,
): PlannedAllocation[] {
  const ordered = sortChargeLines(lines).filter((line) => toCents(line.outstanding) > 0);
  const totalOutstanding = ordered.reduce((sum, line) => sum + toCents(line.outstanding), 0);

  if (request.mode === AllocationMode.ITEMS) {
    return planExplicit(lines, request.allocations);
  }
  if (totalOutstanding === 0) {
    throw new NothingToPayError();
  }
  let remaining = totalOutstanding;
  if (request.mode === AllocationMode.AMOUNT) {
    remaining = toCents(request.amount);
    if (remaining <= 0) {
      throw new InvalidPaymentAmountError('El monto del pago debe ser mayor a 0');
    }
    if (remaining > totalOutstanding) {
      throw new PaymentExceedsBalanceError(request.amount, fromCents(totalOutstanding));
    }
  }

  const planned: PlannedAllocation[] = [];
  for (const line of ordered) {
    if (remaining === 0) {
      break;
    }
    const cents = Math.min(remaining, toCents(line.outstanding));
    planned.push({ concept: line.concept, orderItemId: line.orderItemId, amount: fromCents(cents) });
    remaining -= cents;
  }
  return planned;
}

function planExplicit(
  lines: ChargeLine[],
  requested: RequestedAllocation[],
): PlannedAllocation[] {
  if (requested.length === 0) {
    throw new InvalidPaymentAmountError('Indica al menos un producto a pagar');
  }
  const seen = new Set<string>();
  return requested.map((allocation) => {
    const key = allocation.orderItemId ?? AllocationConcept.DELIVERY_FEE;
    const target = allocation.orderItemId
      ? `El producto "${allocation.orderItemId}"`
      : 'El costo de envío';
    if (seen.has(key)) {
      throw new DuplicateAllocationTargetError(target);
    }
    seen.add(key);
    const line = lines.find((candidate) =>
      allocation.orderItemId
        ? candidate.orderItemId === allocation.orderItemId
        : candidate.concept === AllocationConcept.DELIVERY_FEE,
    );
    if (!line) {
      throw new AllocationTargetNotInAttentionError(target);
    }
    const cents = toCents(allocation.amount);
    if (cents <= 0) {
      throw new InvalidPaymentAmountError('Cada monto asignado debe ser mayor a 0');
    }
    if (cents > toCents(line.outstanding)) {
      throw new AllocationExceedsItemBalanceError(line.label, allocation.amount, line.outstanding);
    }
    return { concept: line.concept, orderItemId: line.orderItemId, amount: fromCents(cents) };
  });
}

export function sumAllocations(allocations: { amount: number }[]): number {
  return fromCents(allocations.reduce((sum, allocation) => sum + toCents(allocation.amount), 0));
}
