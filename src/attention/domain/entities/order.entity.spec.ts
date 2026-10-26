import { AttentionStatus } from '../enums/attention-status.enum.js';
import { OrderItemStatus } from '../enums/order-item-status.enum.js';
import { OrderSource } from '../enums/order-source.enum.js';
import { OrderStatus } from '../enums/order-status.enum.js';
import { ServiceType } from '../enums/service-type.enum.js';
import { OrderAlreadyFinishedError } from '../exceptions/attention.errors.js';
import { Attention } from './attention.entity.js';
import { Order } from './order.entity.js';

const { SUBMITTED, PREPARING, READY, DELIVERED, REJECTED, CANCELLED } = OrderItemStatus;

function submitOrder(attentionId = 'attention-1', id = 'order-1'): Order {
  return Order.submit({
    id,
    attentionId,
    requestId: `request-${id}`,
    source: OrderSource.WAITER,
  });
}

describe('Order', () => {
  it('starts SUBMITTED and can be confirmed once', () => {
    const order = submitOrder();
    expect(order.status).toBe(OrderStatus.SUBMITTED);
    order.confirm();
    expect(order.status).toBe(OrderStatus.CONFIRMED);
    expect(order.confirmedAt).toBeInstanceOf(Date);
  });

  it.each([
    [[SUBMITTED, SUBMITTED], OrderStatus.SUBMITTED],
    [[SUBMITTED, PREPARING], OrderStatus.PREPARING],
    [[READY, DELIVERED, SUBMITTED], OrderStatus.PREPARING],
    [[READY, DELIVERED], OrderStatus.READY],
    [[DELIVERED, DELIVERED], OrderStatus.SERVED],
    [[DELIVERED, CANCELLED, REJECTED], OrderStatus.SERVED],
    [[CANCELLED, REJECTED], OrderStatus.CANCELLED],
  ])('derives its status from the items %j -> %s', (items, expected) => {
    const order = submitOrder();
    order.syncWithItems(items);
    expect(order.status).toBe(expected);
  });

  it('keeps CONFIRMED while the kitchen has not started', () => {
    const order = submitOrder();
    order.confirm();
    order.syncWithItems([SUBMITTED, CANCELLED]);
    expect(order.status).toBe(OrderStatus.CONFIRMED);
  });

  it('can only be cancelled while nothing has been served', () => {
    const pending = submitOrder();
    expect(() => pending.assertCancellable([SUBMITTED, READY])).not.toThrow();
    expect(() => pending.assertCancellable([READY, DELIVERED])).toThrow(
      OrderAlreadyFinishedError,
    );
    const cancelled = submitOrder();
    cancelled.syncWithItems([CANCELLED]);
    expect(() => cancelled.assertCancellable([CANCELLED])).toThrow(
      OrderAlreadyFinishedError,
    );
  });

  it('lets one attention hold several orders in different states', () => {
    const attention = Attention.open({
      id: 'attention-1',
      attentionNumber: 'A-1',
      restaurantId: 'restaurant-1',
      serviceType: ServiceType.DINE_IN,
      diningTableId: 'table-1',
    });
    const drinks = submitOrder(attention.id, 'drinks');
    const mains = submitOrder(attention.id, 'mains');
    const desserts = submitOrder(attention.id, 'desserts');
    for (const order of [drinks, mains, desserts]) {
      attention.acceptOrder();
      expect(order.attentionId).toBe(attention.id);
    }

    drinks.syncWithItems([DELIVERED]);
    mains.syncWithItems([PREPARING]);
    desserts.syncWithItems([CANCELLED]);

    expect([drinks.status, mains.status, desserts.status]).toEqual([
      OrderStatus.SERVED,
      OrderStatus.PREPARING,
      OrderStatus.CANCELLED,
    ]);
    // Serving or cancelling single orders never closes the attention.
    expect(attention.status).toBe(AttentionStatus.OPEN);
    expect(attention.isActive).toBe(true);
  });
});
