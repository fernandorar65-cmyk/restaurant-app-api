import { AttentionStatus } from '../enums/attention-status.enum.js';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum.js';
import { OrderSource } from '../enums/order-source.enum.js';
import { OrderStatus } from '../enums/order-status.enum.js';
import { OrderAlreadyFinishedError } from '../exceptions/attention.errors.js';
import { StatusCatalog } from '../status-catalog.js';
import {
  ATTENTION_WORKFLOW,
  DEFAULT_ATTENTION_STATUSES,
  DEFAULT_ORDER_STATUSES,
  ORDER_WORKFLOW,
  type WorkflowDefinition,
  type WorkflowStatusSeed,
} from '../workflows.js';
import { Attention } from './attention.entity.js';
import { Order } from './order.entity.js';
import { WorkflowStatus } from './workflow-status.entity.js';

const { SUBMITTED, IN_PREPARATION, READY, SERVED, REJECTED, CANCELLED } =
  OrderStatus;

function catalog<C extends string>(
  workflow: WorkflowDefinition<C>,
  seeds: WorkflowStatusSeed<C>[],
): StatusCatalog<C> {
  const statuses = seeds.map((seed) =>
    WorkflowStatus.create(workflow, {
      ...seed,
      id: `status-${seed.code}`,
      restaurantId: 'r1',
    }),
  );
  statuses
    .find((status) => status.canonicalState === workflow.initial)
    ?.markInitial();
  return new StatusCatalog(workflow, 'r1', statuses);
}

const orderStatuses = catalog(ORDER_WORKFLOW, DEFAULT_ORDER_STATUSES);
const attentionStatuses = catalog(
  ATTENTION_WORKFLOW,
  DEFAULT_ATTENTION_STATUSES,
);

function submitOrder(attentionId = 'attention-1', id = 'order-1'): Order {
  return Order.submit({
    id,
    attentionId,
    requestId: `request-${id}`,
    source: OrderSource.WAITER,
    status: orderStatuses.initial(),
  });
}

describe('Order', () => {
  it('starts SUBMITTED and can be confirmed once', () => {
    const order = submitOrder();
    expect(order.status).toBe(OrderStatus.SUBMITTED);
    order.confirm(orderStatuses);
    expect(order.status).toBe(OrderStatus.CONFIRMED);
    expect(order.statusId).toBe('status-CONFIRMED');
    expect(order.confirmedAt).toBeInstanceOf(Date);
  });

  it.each([
    [[SUBMITTED, SUBMITTED], OrderStatus.SUBMITTED],
    [[SUBMITTED, IN_PREPARATION], OrderStatus.IN_PREPARATION],
    [[READY, SERVED, SUBMITTED], OrderStatus.IN_PREPARATION],
    [[READY, SERVED], OrderStatus.READY],
    [[SERVED, SERVED], OrderStatus.SERVED],
    [[SERVED, CANCELLED, REJECTED], OrderStatus.SERVED],
    [[CANCELLED, REJECTED], OrderStatus.CANCELLED],
  ])('derives its status from the items %j -> %s', (items, expected) => {
    const order = submitOrder();
    order.syncWithItems(items, orderStatuses);
    expect(order.status).toBe(expected);
  });

  it('keeps CONFIRMED while the kitchen has not started', () => {
    const order = submitOrder();
    order.confirm(orderStatuses);
    order.syncWithItems([SUBMITTED, CANCELLED], orderStatuses);
    expect(order.status).toBe(OrderStatus.CONFIRMED);
  });

  it('can only be cancelled while nothing has been served', () => {
    const pending = submitOrder();
    expect(() => pending.assertCancellable([SUBMITTED, READY])).not.toThrow();
    expect(() => pending.assertCancellable([READY, SERVED])).toThrow(
      OrderAlreadyFinishedError,
    );
    const cancelled = submitOrder();
    cancelled.syncWithItems([CANCELLED], orderStatuses);
    expect(() => cancelled.assertCancellable([CANCELLED])).toThrow(
      OrderAlreadyFinishedError,
    );
  });

  it('lets one attention hold several orders in different states', () => {
    const attention = Attention.open({
      id: 'attention-1',
      attentionNumber: 'A-1',
      restaurantId: 'r1',
      serviceType: {
        id: 'dine-in',
        fulfillmentMode: FulfillmentMode.DINE_IN,
        requiresTable: true,
      },
      status: attentionStatuses.initial(),
      diningTableId: 'table-1',
    });
    const drinks = submitOrder(attention.id, 'drinks');
    const mains = submitOrder(attention.id, 'mains');
    const desserts = submitOrder(attention.id, 'desserts');
    for (const order of [drinks, mains, desserts]) {
      attention.acceptOrder(attentionStatuses.defaultFor(AttentionStatus.OPEN));
      expect(order.attentionId).toBe(attention.id);
    }

    drinks.syncWithItems([SERVED], orderStatuses);
    mains.syncWithItems([IN_PREPARATION], orderStatuses);
    desserts.syncWithItems([CANCELLED], orderStatuses);

    expect([drinks.status, mains.status, desserts.status]).toEqual([
      OrderStatus.SERVED,
      OrderStatus.IN_PREPARATION,
      OrderStatus.CANCELLED,
    ]);
    // Serving or cancelling single orders never closes the attention.
    expect(attention.status).toBe(AttentionStatus.OPEN);
    expect(attention.isActive).toBe(true);
  });
});
