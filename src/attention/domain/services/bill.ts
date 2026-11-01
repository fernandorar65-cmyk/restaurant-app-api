import { Money } from '../../../common/domain/value-objects/money.js';
import type { Fulfillment } from '../entities/fulfillment.entity.js';
import type { OrderItem } from '../entities/order-item.entity.js';

export interface Bill {
  /** Billable products only: rejected and cancelled items are never charged. */
  items: OrderItem[];
  subtotal: number;
  /** Pickup/delivery record the fee belongs to (null when there is none). */
  fulfillmentId: string | null;
  deliveryFee: number;
  total: number;
  paid: number;
  balance: number;
}

/** What an attention owes: its billable products plus the delivery fee, minus what was paid. */
export function computeBill(params: {
  items: OrderItem[];
  fulfillment: Fulfillment | null;
  paid: number;
}): Bill {
  const billable = params.items.filter((item) => item.isBillable);
  const subtotal = Money.sum(billable.map((item) => Money.of(item.subtotal)));
  const deliveryFee = Money.of(params.fulfillment?.deliveryFee ?? 0);
  const total = subtotal.plus(deliveryFee);
  const paid = Money.of(params.paid);
  return {
    items: billable,
    subtotal: subtotal.amount,
    fulfillmentId: params.fulfillment?.id ?? null,
    deliveryFee: deliveryFee.amount,
    total: total.amount,
    paid: paid.amount,
    balance: total.minus(paid).amount,
  };
}
