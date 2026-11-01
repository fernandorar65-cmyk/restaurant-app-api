import { AttentionStatus } from './enums/attention-status.enum.js';
import { OrderStatus } from './enums/order-status.enum.js';
import { WorkflowStatus } from './entities/workflow-status.entity.js';
import {
  StatusNotConfiguredError,
  WorkflowStatusNotFoundError,
} from './exceptions/attention.errors.js';
import { StatusCatalog } from './status-catalog.js';
import {
  ATTENTION_WORKFLOW,
  DEFAULT_ORDER_STATUSES,
  ORDER_WORKFLOW,
} from './workflows.js';

function orderStatus(params: {
  code: string;
  canonicalState: OrderStatus;
  sortOrder: number;
  restaurantId?: string;
}): WorkflowStatus<OrderStatus> {
  return WorkflowStatus.create(ORDER_WORKFLOW, {
    id: `status-${params.code}`,
    restaurantId: params.restaurantId ?? 'r1',
    code: params.code,
    name: params.code,
    canonicalState: params.canonicalState,
    sortOrder: params.sortOrder,
  });
}

function defaultOrderStatuses(): WorkflowStatus<OrderStatus>[] {
  const statuses = DEFAULT_ORDER_STATUSES.map((seed) =>
    orderStatus({
      code: seed.code,
      canonicalState: seed.canonicalState,
      sortOrder: seed.sortOrder,
    }),
  );
  statuses
    .find((status) => status.canonicalState === OrderStatus.SUBMITTED)
    ?.markInitial();
  return statuses;
}

describe('StatusCatalog', () => {
  describe('initial', () => {
    it('returns the active status marked as initial', () => {
      const catalog = new StatusCatalog(
        ORDER_WORKFLOW,
        'r1',
        defaultOrderStatuses(),
      );
      expect(catalog.initial()).toEqual({
        id: 'status-SUBMITTED',
        canonicalState: OrderStatus.SUBMITTED,
      });
    });

    it('fails when no status is marked as initial', () => {
      const statuses = defaultOrderStatuses();
      statuses.forEach((status) => status.unmarkInitial());
      const catalog = new StatusCatalog(ORDER_WORKFLOW, 'r1', statuses);
      expect(() => catalog.initial()).toThrow(StatusNotConfiguredError);
    });

    it('ignores an initial status that was deactivated', () => {
      const statuses = defaultOrderStatuses();
      statuses.find((status) => status.isInitial)?.deactivate();
      const catalog = new StatusCatalog(ORDER_WORKFLOW, 'r1', statuses);
      expect(() => catalog.initial()).toThrow(StatusNotConfiguredError);
    });
  });

  describe('defaultFor', () => {
    it('picks the first active status of the state by sort order', () => {
      const late = orderStatus({
        code: 'PLATED',
        canonicalState: OrderStatus.READY,
        sortOrder: 90,
      });
      const early = orderStatus({
        code: 'ON_PASS',
        canonicalState: OrderStatus.READY,
        sortOrder: 5,
      });
      const catalog = new StatusCatalog(ORDER_WORKFLOW, 'r1', [
        ...defaultOrderStatuses(),
        late,
        early,
      ]);
      expect(catalog.defaultFor(OrderStatus.READY).id).toBe('status-ON_PASS');
    });

    it('skips inactive statuses', () => {
      const early = orderStatus({
        code: 'ON_PASS',
        canonicalState: OrderStatus.READY,
        sortOrder: 5,
      });
      early.deactivate();
      const catalog = new StatusCatalog(ORDER_WORKFLOW, 'r1', [
        ...defaultOrderStatuses(),
        early,
      ]);
      expect(catalog.defaultFor(OrderStatus.READY).id).toBe('status-READY');
    });

    it('fails when the state has no active status', () => {
      const statuses = defaultOrderStatuses();
      statuses
        .filter((status) => status.canonicalState === OrderStatus.READY)
        .forEach((status) => status.deactivate());
      const catalog = new StatusCatalog(ORDER_WORKFLOW, 'r1', statuses);
      expect(() => catalog.defaultFor(OrderStatus.READY)).toThrow(
        StatusNotConfiguredError,
      );
    });

    it('fails for an empty catalog', () => {
      const catalog = new StatusCatalog(ATTENTION_WORKFLOW, 'r1', []);
      expect(() => catalog.defaultFor(AttentionStatus.OPEN)).toThrow(
        StatusNotConfiguredError,
      );
      expect(() => catalog.initial()).toThrow(StatusNotConfiguredError);
    });
  });

  describe('require', () => {
    it('returns an active status of the restaurant by id', () => {
      const catalog = new StatusCatalog(
        ORDER_WORKFLOW,
        'r1',
        defaultOrderStatuses(),
      );
      expect(catalog.require('status-READY')).toEqual({
        id: 'status-READY',
        canonicalState: OrderStatus.READY,
      });
    });

    it('rejects an unknown id', () => {
      const catalog = new StatusCatalog(
        ORDER_WORKFLOW,
        'r1',
        defaultOrderStatuses(),
      );
      expect(() => catalog.require('status-NOPE')).toThrow(
        WorkflowStatusNotFoundError,
      );
    });

    it('rejects a status of another restaurant', () => {
      const foreign = orderStatus({
        code: 'FOREIGN',
        canonicalState: OrderStatus.READY,
        sortOrder: 1,
        restaurantId: 'r2',
      });
      const catalog = new StatusCatalog(ORDER_WORKFLOW, 'r1', [
        ...defaultOrderStatuses(),
        foreign,
      ]);
      expect(() => catalog.require('status-FOREIGN')).toThrow(
        WorkflowStatusNotFoundError,
      );
    });

    it('rejects an inactive status', () => {
      const statuses = defaultOrderStatuses();
      statuses.find((status) => status.id === 'status-READY')?.deactivate();
      const catalog = new StatusCatalog(ORDER_WORKFLOW, 'r1', statuses);
      expect(() => catalog.require('status-READY')).toThrow(
        WorkflowStatusNotFoundError,
      );
    });
  });
});
