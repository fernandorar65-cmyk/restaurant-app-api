import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { OrderStatus } from '../enums/order-status.enum.js';
import {
  InvalidOrderItemTransitionError,
  RejectionReasonRequiredError,
} from '../exceptions/attention.errors.js';
import { StatusCatalog } from '../status-catalog.js';
import { DEFAULT_ORDER_STATUSES, ORDER_WORKFLOW } from '../workflows.js';
import { OrderItem } from './order-item.entity.js';
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

const statuses = DEFAULT_ORDER_STATUSES.map((seed) =>
  WorkflowStatus.create(ORDER_WORKFLOW, {
    ...seed,
    id: `status-${seed.code}`,
    restaurantId: 'r1',
  }),
);
statuses.find((status) => status.canonicalState === SUBMITTED)?.markInitial();
const catalog = new StatusCatalog(ORDER_WORKFLOW, 'r1', statuses);

/** A second restaurant status of the IN_PREPARATION state ("En horno"). */
const inOven = WorkflowStatus.create(ORDER_WORKFLOW, {
  id: 'status-IN_OVEN',
  restaurantId: 'r1',
  code: 'IN_OVEN',
  name: 'En horno',
  canonicalState: IN_PREPARATION,
  sortOrder: 35,
}).ref;

let sequence = 0;
const historyId = () => `history-${++sequence}`;

function createItem(
  overrides: { unitPrice?: number; quantity?: number } = {},
): OrderItem {
  return OrderItem.create({
    id: 'item-1',
    historyId: historyId(),
    status: catalog.initial(),
    orderId: 'order-1',
    productId: 'product-1',
    productName: 'Lomo saltado',
    unitPrice: overrides.unitPrice ?? 25,
    quantity: overrides.quantity ?? 2,
  }).item;
}

/** Builds an item already in the given canonical state through valid moves. */
function itemIn(state: OrderStatus): OrderItem {
  const item = createItem();
  const path: Record<OrderStatus, OrderStatus[]> = {
    [SUBMITTED]: [],
    [CONFIRMED]: [],
    [IN_PREPARATION]: [IN_PREPARATION],
    [READY]: [IN_PREPARATION, READY],
    [SERVED]: [IN_PREPARATION, READY, SERVED],
    [REJECTED]: [REJECTED],
    [CANCELLED]: [CANCELLED],
  };
  for (const step of path[state]) {
    item.changeStatus(catalog.defaultFor(step), {
      historyId: historyId(),
      reason: 'because',
    });
  }
  return item;
}

describe('OrderItem', () => {
  describe('create', () => {
    it('freezes name and price and records the initial history entry', () => {
      const { item, history } = OrderItem.create({
        id: 'item-1',
        historyId: 'history-0',
        status: catalog.initial(),
        orderId: 'order-1',
        productId: 'product-1',
        productName: 'Ceviche',
        unitPrice: 30,
        quantity: 2,
        customerNote: 'Sin cebolla',
        requestedByParticipantId: 'participant-1',
      });
      expect(item.productNameSnapshot).toBe('Ceviche');
      expect(item.unitPrice).toBe(30);
      expect(item.quantity).toBe(2);
      expect(item.subtotal).toBe(60);
      expect(item.customerNote).toBe('Sin cebolla');
      expect(item.requestedByParticipantId).toBe('participant-1');
      expect(item.currentStatus).toBe(SUBMITTED);
      expect(item.statusId).toBe('status-SUBMITTED');
      expect(item.rejectionReason).toBeNull();
      expect(item.version).toBe(0);

      expect(history.id).toBe('history-0');
      expect(history.orderItemId).toBe('item-1');
      expect(history.previousStatus).toBeNull();
      expect(history.newStatus).toEqual(catalog.initial());
      expect(history.versionBefore).toBeNull();
      expect(history.changedByUserId).toBeNull();
    });

    it('defaults optional fields to null', () => {
      const { item } = OrderItem.create({
        id: 'item-1',
        historyId: 'h',
        status: catalog.initial(),
        orderId: 'order-1',
        productId: 'product-1',
        productName: 'Ceviche',
        unitPrice: 30,
        quantity: 1,
      });
      expect(item.customerNote).toBeNull();
      expect(item.requestedByParticipantId).toBeNull();
    });

    it.each([
      [10.1, 3, 30.3],
      [0.1, 3, 0.3],
      [19.99, 7, 139.93],
      [0, 4, 0],
    ])(
      'computes the subtotal %s x %s = %s in cents',
      (unitPrice, quantity, expected) => {
        const item = createItem({ unitPrice, quantity });
        expect(item.subtotal).toBe(expected);
      },
    );

    it.each([0, -1, 1.5, Number.NaN])(
      'rejects a quantity of %s',
      (quantity) => {
        expect(() => createItem({ quantity })).toThrow(ValidationDomainError);
      },
    );
  });

  describe('changeStatus', () => {
    it.each([
      [SUBMITTED, IN_PREPARATION],
      [SUBMITTED, CANCELLED],
      [IN_PREPARATION, READY],
      [IN_PREPARATION, CANCELLED],
      [READY, SERVED],
      [READY, CANCELLED],
    ])('allows %s -> %s', (from, to) => {
      const item = itemIn(from);
      item.changeStatus(catalog.defaultFor(to), { historyId: historyId() });
      expect(item.currentStatus).toBe(to);
    });

    it.each([
      [SUBMITTED, READY],
      [SUBMITTED, SERVED],
      [SUBMITTED, CONFIRMED],
      [IN_PREPARATION, SUBMITTED],
      [IN_PREPARATION, SERVED],
      [IN_PREPARATION, REJECTED],
      [READY, IN_PREPARATION],
      [SERVED, CANCELLED],
      [CANCELLED, IN_PREPARATION],
      [REJECTED, SUBMITTED],
    ])('forbids %s -> %s', (from, to) => {
      const item = itemIn(from);
      expect(() =>
        item.changeStatus(catalog.defaultFor(to), {
          historyId: historyId(),
          reason: 'because',
        }),
      ).toThrow(InvalidOrderItemTransitionError);
      expect(item.currentStatus).toBe(from);
    });

    it('allows moving between restaurant statuses of the same non-final state', () => {
      const item = itemIn(IN_PREPARATION);
      const history = item.changeStatus(inOven, { historyId: 'h-oven' });
      expect(item.currentStatus).toBe(IN_PREPARATION);
      expect(item.statusId).toBe('status-IN_OVEN');
      expect(history.previousStatus?.id).toBe('status-IN_PREPARATION');
      expect(history.newStatus.id).toBe('status-IN_OVEN');
    });

    it('rejects re-applying the very same status', () => {
      const item = itemIn(IN_PREPARATION);
      expect(() =>
        item.changeStatus(catalog.defaultFor(IN_PREPARATION), {
          historyId: historyId(),
        }),
      ).toThrow(InvalidOrderItemTransitionError);
    });

    it('rejects moving within a final state', () => {
      const item = itemIn(SERVED);
      const otherServed = { id: 'status-DELIVERED', canonicalState: SERVED };
      expect(() =>
        item.changeStatus(otherServed, { historyId: historyId() }),
      ).toThrow(InvalidOrderItemTransitionError);
    });

    it('returns a history entry with the previous status and the version before', () => {
      const item = createItem();
      const history = item.changeStatus(catalog.defaultFor(IN_PREPARATION), {
        historyId: 'h-1',
        changedByUserId: 'cook-1',
        reason: '  started  ',
      });
      expect(history.id).toBe('h-1');
      expect(history.orderItemId).toBe('item-1');
      expect(history.previousStatus).toEqual(catalog.initial());
      expect(history.newStatus).toEqual(catalog.defaultFor(IN_PREPARATION));
      expect(history.changedByUserId).toBe('cook-1');
      expect(history.reason).toBe('started');
      expect(history.versionBefore).toBe(item.version);
      expect(history.changedAt).toBeInstanceOf(Date);
    });

    it('requires a reason to reject and keeps it', () => {
      const item = createItem();
      expect(() =>
        item.changeStatus(catalog.defaultFor(REJECTED), {
          historyId: historyId(),
          reason: '   ',
        }),
      ).toThrow(RejectionReasonRequiredError);
      expect(item.currentStatus).toBe(SUBMITTED);

      item.changeStatus(catalog.defaultFor(REJECTED), {
        historyId: historyId(),
        reason: ' Out of fish ',
      });
      expect(item.currentStatus).toBe(REJECTED);
      expect(item.rejectionReason).toBe('Out of fish');
    });

    it('does not store a reason as rejection reason for other moves', () => {
      const item = createItem();
      item.changeStatus(catalog.defaultFor(CANCELLED), {
        historyId: historyId(),
        reason: 'Customer changed mind',
      });
      expect(item.rejectionReason).toBeNull();
    });
  });

  describe('isBillable', () => {
    it.each([
      [SUBMITTED, true],
      [IN_PREPARATION, true],
      [READY, true],
      [SERVED, true],
      [REJECTED, false],
      [CANCELLED, false],
    ])('%s -> %s', (state, expected) => {
      expect(itemIn(state).isBillable).toBe(expected);
    });
  });
});

describe('OrderItem unit price', () => {
  it.each([-5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects a unit price of %s',
    (unitPrice) => {
      expect(() => createItem({ unitPrice })).toThrow(ValidationDomainError);
    },
  );
});
