import { AttentionStatus } from '../enums/attention-status.enum.js';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum.js';
import { OrderSource } from '../enums/order-source.enum.js';
import { OrderStatus } from '../enums/order-status.enum.js';
import {
  EmptyOrderError,
  OrderAlreadyFinishedError,
  OrderItemHasPaymentsError,
  OrderItemNotFoundError,
  StaleOrderItemVersionError,
} from '../exceptions/attention.errors.js';
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

const {
  SUBMITTED,
  CONFIRMED,
  IN_PREPARATION,
  READY,
  SERVED,
  REJECTED,
  CANCELLED,
} = OrderStatus;

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

let sequence = 0;
const nextId = () => `id-${++sequence}`;

function submitOrder(
  attentionId = 'attention-1',
  id = 'order-1',
  lines = 2,
): Order {
  return Order.submit({
    id,
    attentionId,
    requestId: `request-${id}`,
    source: OrderSource.WAITER,
    status: orderStatuses.initial(),
    lines: Array.from({ length: lines }, (_, index) => ({
      itemId: `${id}-item-${index}`,
      historyId: nextId(),
      productId: `product-${index}`,
      productName: `Plato ${index}`,
      unitPrice: 10,
      quantity: 1,
    })),
  });
}

/** Walks an item to the given canonical state through valid kitchen moves. */
const PATHS: Record<string, OrderStatus[]> = {
  [SUBMITTED]: [],
  [IN_PREPARATION]: [IN_PREPARATION],
  [READY]: [IN_PREPARATION, READY],
  [SERVED]: [IN_PREPARATION, READY, SERVED],
  [REJECTED]: [REJECTED],
  [CANCELLED]: [CANCELLED],
};

function moveItem(order: Order, index: number, state: OrderStatus): void {
  for (const step of PATHS[state]) {
    order.changeItemStatus(
      order.items[index].id,
      orderStatuses.defaultFor(step),
      {
        historyId: nextId(),
        statuses: orderStatuses,
        reason: step === REJECTED ? 'Sin stock' : null,
      },
    );
  }
}

describe('Order', () => {
  it('is submitted with its items and their first history entries', () => {
    const order = submitOrder(undefined, undefined, 3);

    expect(order.status).toBe(SUBMITTED);
    expect(order.items).toHaveLength(3);
    expect(order.items.every((item) => item.currentStatus === SUBMITTED)).toBe(
      true,
    );
    const changes = order.pullChanges();
    expect(changes.newItems).toHaveLength(3);
    expect(changes.changedItems).toHaveLength(0);
    expect(changes.history).toHaveLength(3);
    expect(order.pullChanges().history).toHaveLength(0);
  });

  it('needs at least one item', () => {
    expect(() => submitOrder(undefined, undefined, 0)).toThrow(EmptyOrderError);
  });

  it('starts SUBMITTED and can be confirmed once', () => {
    const order = submitOrder();
    order.confirm(orderStatuses);
    expect(order.status).toBe(CONFIRMED);
    expect(order.statusId).toBe('status-CONFIRMED');
    expect(order.confirmedAt).toBeInstanceOf(Date);
  });

  it.each([
    [[SUBMITTED, SUBMITTED], SUBMITTED],
    [[SUBMITTED, IN_PREPARATION], IN_PREPARATION],
    [[READY, SERVED, SUBMITTED], IN_PREPARATION],
    [[READY, SERVED], READY],
    [[SERVED, SERVED], SERVED],
    [[SERVED, CANCELLED, REJECTED], SERVED],
    [[CANCELLED, REJECTED], CANCELLED],
  ])('derives its status from the items %j -> %s', (states, expected) => {
    const order = submitOrder(undefined, undefined, states.length);
    states.forEach((state, index) => moveItem(order, index, state));
    expect(order.status).toBe(expected);
  });

  it('keeps CONFIRMED while the kitchen has not started', () => {
    const order = submitOrder();
    order.confirm(orderStatuses);
    moveItem(order, 1, CANCELLED);
    expect(order.status).toBe(CONFIRMED);
  });

  it('tracks the changed items and their history for the repository', () => {
    const order = submitOrder();
    order.pullChanges();

    const from = order.changeItemStatus(
      order.items[0].id,
      orderStatuses.defaultFor(IN_PREPARATION),
      { historyId: 'h-1', statuses: orderStatuses, changedByUserId: 'cook' },
    );

    expect(from).toBe(SUBMITTED);
    const changes = order.pullChanges();
    expect(changes.newItems).toHaveLength(0);
    expect(changes.changedItems.map((item) => item.id)).toEqual([
      order.items[0].id,
    ]);
    expect(changes.history.map((entry) => entry.id)).toEqual(['h-1']);
  });

  it('rejects a change based on a stale version or for an item of another order', () => {
    const order = submitOrder();
    const item = order.items[0];
    const move = (itemId: string, expectedVersion?: number) =>
      order.changeItemStatus(itemId, orderStatuses.defaultFor(IN_PREPARATION), {
        historyId: nextId(),
        statuses: orderStatuses,
        expectedVersion,
      });

    expect(() => move(item.id, item.version + 1)).toThrow(
      StaleOrderItemVersionError,
    );
    expect(() => move('another-order-item')).toThrow(OrderItemNotFoundError);
    expect(item.currentStatus).toBe(SUBMITTED);
  });

  it('never drops a paid item from the bill', () => {
    const order = submitOrder();
    const paid = new Set([order.items[0].id]);

    expect(() =>
      order.changeItemStatus(
        order.items[0].id,
        orderStatuses.defaultFor(CANCELLED),
        {
          historyId: nextId(),
          statuses: orderStatuses,
          paidItemIds: paid,
        },
      ),
    ).toThrow(OrderItemHasPaymentsError);
    // Moving it forward is still fine.
    order.changeItemStatus(
      order.items[0].id,
      orderStatuses.defaultFor(IN_PREPARATION),
      {
        historyId: nextId(),
        statuses: orderStatuses,
        paidItemIds: paid,
      },
    );
    expect(order.items[0].currentStatus).toBe(IN_PREPARATION);
  });

  describe('cancel', () => {
    const cancel = (order: Order, paidItemIds?: ReadonlySet<string>) =>
      order.cancel(orderStatuses.defaultFor(CANCELLED), {
        statuses: orderStatuses,
        nextHistoryId: nextId,
        reason: 'La mesa cambió de opinión',
        paidItemIds,
      });

    it('cancels its pending items with history and becomes CANCELLED', () => {
      const order = submitOrder(undefined, undefined, 3);
      moveItem(order, 0, READY);
      moveItem(order, 1, REJECTED);
      order.pullChanges();

      cancel(order);

      expect(order.items.map((item) => item.currentStatus)).toEqual([
        CANCELLED,
        REJECTED,
        CANCELLED,
      ]);
      expect(order.status).toBe(CANCELLED);
      const changes = order.pullChanges();
      expect(changes.changedItems).toHaveLength(2);
      expect(changes.history).toHaveLength(2);
    });

    it('is refused once something was served or the order is finished', () => {
      const served = submitOrder();
      moveItem(served, 0, SERVED);
      expect(() => cancel(served)).toThrow(OrderAlreadyFinishedError);

      const cancelled = submitOrder();
      cancel(cancelled);
      expect(() => cancel(cancelled)).toThrow(OrderAlreadyFinishedError);
    });

    it('is refused when a pending item is already paid, changing nothing', () => {
      const order = submitOrder();
      expect(() => cancel(order, new Set([order.items[1].id]))).toThrow(
        OrderItemHasPaymentsError,
      );
      expect(
        order.items.every((item) => item.currentStatus === SUBMITTED),
      ).toBe(true);
    });
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
    const drinks = submitOrder(attention.id, 'drinks', 1);
    const mains = submitOrder(attention.id, 'mains', 1);
    const desserts = submitOrder(attention.id, 'desserts', 1);
    for (const order of [drinks, mains, desserts]) {
      attention.acceptOrder(attentionStatuses.defaultFor(AttentionStatus.OPEN));
      expect(order.attentionId).toBe(attention.id);
    }

    moveItem(drinks, 0, SERVED);
    moveItem(mains, 0, IN_PREPARATION);
    moveItem(desserts, 0, CANCELLED);

    expect([drinks.status, mains.status, desserts.status]).toEqual([
      SERVED,
      IN_PREPARATION,
      CANCELLED,
    ]);
    // Serving or cancelling single orders never closes the attention.
    expect(attention.status).toBe(AttentionStatus.OPEN);
    expect(attention.isActive).toBe(true);
  });
});
