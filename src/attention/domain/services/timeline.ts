import type { Attention } from '../entities/attention.entity.js';
import type { OrderItemStatusHistory } from '../entities/order-item-status-history.entity.js';
import type { OrderItem } from '../entities/order-item.entity.js';
import type { Order } from '../entities/order.entity.js';

export type TimelineEventType =
  | 'ATTENTION_OPENED'
  | 'ORDER_SUBMITTED'
  | 'ORDER_CONFIRMED'
  | 'ITEM_STATUS_CHANGED'
  | 'BILL_REQUESTED'
  | 'ATTENTION_CLOSED'
  | 'ATTENTION_CANCELLED';

export interface TimelineEvent {
  type: TimelineEventType;
  at: Date;
  orderId: string | null;
  orderItemId: string | null;
  productName: string | null;
  /** Canonical statuses, for item changes. */
  fromStatus: string | null;
  toStatus: string | null;
  /** Restaurant status the item moved to (name and color in /order-statuses). */
  toStatusId: string | null;
  userId: string | null;
  reason: string | null;
}

/** Events of the same instant keep the lifecycle order (opened before ordered...). */
const ORDER_OF_TYPES: TimelineEventType[] = [
  'ATTENTION_OPENED',
  'ORDER_SUBMITTED',
  'ITEM_STATUS_CHANGED',
  'ORDER_CONFIRMED',
  'BILL_REQUESTED',
  'ATTENTION_CLOSED',
  'ATTENTION_CANCELLED',
];

/**
 * The attention's history, oldest first, rebuilt from what is stored: its
 * own timestamps, each order and every item status change. Only the last
 * bill request is known (asking again after a new order overwrites it).
 */
export function buildTimeline(params: {
  attention: Attention;
  orders: Order[];
  items: OrderItem[];
  history: OrderItemStatusHistory[];
}): TimelineEvent[] {
  const { attention, orders, items, history } = params;
  const event = (
    type: TimelineEventType,
    at: Date,
    extra: Partial<TimelineEvent> = {},
  ): TimelineEvent => ({
    type,
    at,
    orderId: null,
    orderItemId: null,
    productName: null,
    fromStatus: null,
    toStatus: null,
    toStatusId: null,
    userId: null,
    reason: null,
    ...extra,
  });

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const events: TimelineEvent[] = [
    event('ATTENTION_OPENED', attention.openedAt),
  ];
  for (const order of orders) {
    events.push(
      event('ORDER_SUBMITTED', order.submittedAt, {
        orderId: order.id,
        userId: order.submittedByUserId,
      }),
    );
    if (order.confirmedAt) {
      events.push(
        event('ORDER_CONFIRMED', order.confirmedAt, { orderId: order.id }),
      );
    }
  }
  for (const entry of history) {
    const item = itemsById.get(entry.orderItemId);
    events.push(
      event('ITEM_STATUS_CHANGED', entry.changedAt, {
        orderId: item?.orderId ?? null,
        orderItemId: entry.orderItemId,
        productName: item?.productNameSnapshot ?? null,
        fromStatus: entry.previousStatus?.canonicalState ?? null,
        toStatus: entry.newStatus.canonicalState,
        toStatusId: entry.newStatus.id,
        userId: entry.changedByUserId,
        reason: entry.reason,
      }),
    );
  }
  if (attention.billRequestedAt) {
    events.push(event('BILL_REQUESTED', attention.billRequestedAt));
  }
  if (attention.closedAt) {
    events.push(event('ATTENTION_CLOSED', attention.closedAt));
  }
  if (attention.cancelledAt) {
    events.push(
      event('ATTENTION_CANCELLED', attention.cancelledAt, {
        reason: attention.cancellationReason,
      }),
    );
  }
  return events
    .map((entry, index) => ({ entry, index }))
    .sort(
      (a, b) =>
        a.entry.at.getTime() - b.entry.at.getTime() ||
        ORDER_OF_TYPES.indexOf(a.entry.type) -
          ORDER_OF_TYPES.indexOf(b.entry.type) ||
        a.index - b.index,
    )
    .map(({ entry }) => entry);
}
