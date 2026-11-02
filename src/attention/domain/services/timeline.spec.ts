import { describe, expect, it } from 'vitest';
import { Attention } from '../entities/attention.entity.js';
import { OrderItemStatusHistory } from '../entities/order-item-status-history.entity.js';
import { OrderItem } from '../entities/order-item.entity.js';
import { Order } from '../entities/order.entity.js';
import { AttentionStatus } from '../enums/attention-status.enum.js';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum.js';
import { OrderSource } from '../enums/order-source.enum.js';
import { OrderStatus } from '../enums/order-status.enum.js';
import { buildTimeline } from './timeline.js';

const at = (minute: number) => new Date(Date.UTC(2026, 2, 15, 20, minute));
const status = <C extends string>(canonicalState: C) => ({
  id: `status-${canonicalState}`,
  canonicalState,
});

const attention = Attention.fromPersistence({
  id: 'a1',
  restaurantId: 'r1',
  diningTableId: 't1',
  customerUserId: null,
  attentionNumber: 'A-1',
  serviceTypeId: 'dine-in',
  fulfillmentMode: FulfillmentMode.DINE_IN,
  status: status(AttentionStatus.CLOSED),
  billRequestedAt: at(40),
  openedAt: at(0),
  closedAt: at(45),
  cancelledAt: null,
  cancellationReason: null,
  version: 3,
  createdAt: at(0),
  updatedAt: at(45),
});

const item = OrderItem.fromPersistence({
  id: 'i1',
  orderId: 'o1',
  productId: 'p1',
  requestedByParticipantId: null,
  productNameSnapshot: 'Lomo saltado',
  unitPrice: 40,
  quantity: 1,
  subtotal: 40,
  customerNote: null,
  status: status(OrderStatus.SERVED),
  rejectionReason: null,
  version: 3,
  createdAt: at(0),
  updatedAt: at(30),
});

const order = Order.fromPersistence(
  {
    id: 'o1',
    attentionId: 'a1',
    requestId: 'req-1',
    source: OrderSource.WAITER,
    submittedByUserId: 'waiter-1',
    submittedByParticipantId: null,
    status: status(OrderStatus.SERVED),
    submittedAt: at(0),
    confirmedAt: at(5),
    createdAt: at(0),
    updatedAt: at(30),
  },
  [item],
);

const change = (
  id: string,
  minute: number,
  from: OrderStatus | null,
  to: OrderStatus,
) =>
  OrderItemStatusHistory.fromPersistence({
    id,
    orderItemId: 'i1',
    previousStatus: from && status(from),
    newStatus: status(to),
    changedByUserId: 'cook-1',
    reason: null,
    changedAt: at(minute),
    versionBefore: null,
  });

describe('buildTimeline', () => {
  it('merges attention, orders and item changes oldest first', () => {
    const timeline = buildTimeline({
      attention,
      orders: [order],
      items: [item],
      history: [
        change('h3', 30, OrderStatus.READY, OrderStatus.SERVED),
        change('h1', 0, null, OrderStatus.SUBMITTED),
        change('h2', 10, OrderStatus.SUBMITTED, OrderStatus.IN_PREPARATION),
      ],
    });
    expect(
      timeline.map((event) => [event.type, event.at.getUTCMinutes()]),
    ).toEqual([
      ['ATTENTION_OPENED', 0],
      ['ORDER_SUBMITTED', 0],
      ['ITEM_STATUS_CHANGED', 0],
      ['ORDER_CONFIRMED', 5],
      ['ITEM_STATUS_CHANGED', 10],
      ['ITEM_STATUS_CHANGED', 30],
      ['BILL_REQUESTED', 40],
      ['ATTENTION_CLOSED', 45],
    ]);
    expect(timeline[4]).toMatchObject({
      orderId: 'o1',
      orderItemId: 'i1',
      productName: 'Lomo saltado',
      fromStatus: OrderStatus.SUBMITTED,
      toStatus: OrderStatus.IN_PREPARATION,
      toStatusId: 'status-IN_PREPARATION',
      userId: 'cook-1',
    });
    expect(timeline[1].userId).toBe('waiter-1');
  });
});
