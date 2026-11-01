import { AttentionStatus } from '../enums/attention-status.enum.js';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum.js';
import {
  AttentionHasPaymentsError,
  AttentionNotActiveError,
  InvalidServiceSetupError,
  OutstandingBalanceError,
} from '../exceptions/attention.errors.js';
import { StatusCatalog } from '../status-catalog.js';
import {
  ATTENTION_WORKFLOW,
  DEFAULT_ATTENTION_STATUSES,
} from '../workflows.js';
import { Attention } from './attention.entity.js';
import type { ServiceTypeRef } from './service-type.entity.js';
import { WorkflowStatus } from './workflow-status.entity.js';

const { OPEN, BILL_REQUESTED, CLOSED, CANCELLED } = AttentionStatus;

const statuses = DEFAULT_ATTENTION_STATUSES.map((seed) =>
  WorkflowStatus.create(ATTENTION_WORKFLOW, {
    ...seed,
    id: `status-${seed.code}`,
    restaurantId: 'r1',
  }),
);
statuses.find((status) => status.canonicalState === OPEN)?.markInitial();
const catalog = new StatusCatalog(ATTENTION_WORKFLOW, 'r1', statuses);

const dineIn: ServiceTypeRef = {
  id: 'dine-in',
  fulfillmentMode: FulfillmentMode.DINE_IN,
  requiresTable: true,
};
const pickup: ServiceTypeRef = {
  id: 'pickup',
  fulfillmentMode: FulfillmentMode.PICKUP,
  requiresTable: false,
};

function openAtTable(): Attention {
  return Attention.open({
    id: 'attention-1',
    attentionNumber: 'A-1',
    restaurantId: 'r1',
    serviceType: dineIn,
    status: catalog.initial(),
    diningTableId: 'table-1',
  });
}

describe('Attention', () => {
  describe('open', () => {
    it('opens a dine-in attention on a table with the initial status', () => {
      const attention = openAtTable();
      expect(attention.status).toBe(OPEN);
      expect(attention.statusId).toBe('status-OPEN');
      expect(attention.diningTableId).toBe('table-1');
      expect(attention.serviceTypeId).toBe('dine-in');
      expect(attention.fulfillmentMode).toBe(FulfillmentMode.DINE_IN);
      expect(attention.customerUserId).toBeNull();
      expect(attention.billRequestedAt).toBeNull();
      expect(attention.closedAt).toBeNull();
      expect(attention.cancelledAt).toBeNull();
      expect(attention.version).toBe(0);
      expect(attention.isActive).toBe(true);
    });

    it('opens a takeaway attention without a table', () => {
      const attention = Attention.open({
        id: 'attention-2',
        attentionNumber: 'A-2',
        restaurantId: 'r1',
        serviceType: pickup,
        status: catalog.initial(),
        customerUserId: 'user-1',
      });
      expect(attention.diningTableId).toBeNull();
      expect(attention.customerUserId).toBe('user-1');
      expect(attention.fulfillmentMode).toBe(FulfillmentMode.PICKUP);
    });

    it('requires a table when the service type does', () => {
      expect(() =>
        Attention.open({
          id: 'a',
          attentionNumber: 'A-3',
          restaurantId: 'r1',
          serviceType: dineIn,
          status: catalog.initial(),
        }),
      ).toThrow(InvalidServiceSetupError);
    });

    it('rejects a table when the service type does not use one', () => {
      expect(() =>
        Attention.open({
          id: 'a',
          attentionNumber: 'A-4',
          restaurantId: 'r1',
          serviceType: pickup,
          status: catalog.initial(),
          diningTableId: 'table-1',
        }),
      ).toThrow(InvalidServiceSetupError);
    });

    it('only opens with an OPEN status', () => {
      expect(() =>
        Attention.open({
          id: 'a',
          attentionNumber: 'A-5',
          restaurantId: 'r1',
          serviceType: pickup,
          status: catalog.defaultFor(BILL_REQUESTED),
        }),
      ).toThrow(/Expected a OPEN status/);
    });
  });

  describe('acceptOrder', () => {
    it('keeps an open attention open', () => {
      const attention = openAtTable();
      attention.acceptOrder(catalog.defaultFor(OPEN));
      expect(attention.status).toBe(OPEN);
    });

    it('re-opens the account after the bill was requested', () => {
      const attention = openAtTable();
      attention.requestBill(catalog.defaultFor(BILL_REQUESTED));
      expect(attention.billRequestedAt).toBeInstanceOf(Date);

      attention.acceptOrder(catalog.defaultFor(OPEN));
      expect(attention.status).toBe(OPEN);
      expect(attention.statusId).toBe('status-OPEN');
      expect(attention.billRequestedAt).toBeNull();
    });

    it('needs an OPEN status to re-open the account', () => {
      const attention = openAtTable();
      attention.requestBill(catalog.defaultFor(BILL_REQUESTED));
      expect(() =>
        attention.acceptOrder(catalog.defaultFor(BILL_REQUESTED)),
      ).toThrow(/Expected a OPEN status/);
      expect(attention.status).toBe(BILL_REQUESTED);
    });

    it('rejects orders once the attention is closed', () => {
      const attention = openAtTable();
      attention.close(0, catalog.defaultFor(CLOSED));
      expect(() => attention.acceptOrder(catalog.defaultFor(OPEN))).toThrow(
        AttentionNotActiveError,
      );
    });
  });

  describe('requestBill', () => {
    it('moves to BILL_REQUESTED and stamps the time', () => {
      const attention = openAtTable();
      attention.requestBill(catalog.defaultFor(BILL_REQUESTED));
      expect(attention.status).toBe(BILL_REQUESTED);
      expect(attention.statusId).toBe('status-BILL_REQUESTED');
      expect(attention.isActive).toBe(true);
    });

    it('is idempotent: asking again keeps the first timestamp', () => {
      const attention = openAtTable();
      attention.requestBill(catalog.defaultFor(BILL_REQUESTED));
      const first = attention.billRequestedAt;
      attention.requestBill(catalog.defaultFor(BILL_REQUESTED));
      expect(attention.status).toBe(BILL_REQUESTED);
      expect(attention.billRequestedAt).toBe(first);
    });

    it('only accepts a BILL_REQUESTED status', () => {
      const attention = openAtTable();
      expect(() => attention.requestBill(catalog.defaultFor(CLOSED))).toThrow(
        /Expected a BILL_REQUESTED status/,
      );
      expect(attention.status).toBe(OPEN);
    });

    it('is not possible on a cancelled attention', () => {
      const attention = openAtTable();
      attention.cancel('mistake', 0, catalog.defaultFor(CANCELLED));
      expect(() =>
        attention.requestBill(catalog.defaultFor(BILL_REQUESTED)),
      ).toThrow(AttentionNotActiveError);
    });
  });

  describe('close', () => {
    it('closes once nothing is owed', () => {
      const attention = openAtTable();
      attention.requestBill(catalog.defaultFor(BILL_REQUESTED));
      attention.close(0, catalog.defaultFor(CLOSED));
      expect(attention.status).toBe(CLOSED);
      expect(attention.closedAt).toBeInstanceOf(Date);
      expect(attention.isActive).toBe(false);
    });

    it.each([12.5, -3])(
      'refuses to close with an outstanding balance of %s',
      (balance) => {
        const attention = openAtTable();
        expect(() =>
          attention.close(balance, catalog.defaultFor(CLOSED)),
        ).toThrow(OutstandingBalanceError);
        expect(attention.status).toBe(OPEN);
        expect(attention.closedAt).toBeNull();
      },
    );

    it('only accepts a CLOSED status', () => {
      const attention = openAtTable();
      expect(() => attention.close(0, catalog.defaultFor(CANCELLED))).toThrow(
        /Expected a CLOSED status/,
      );
    });

    it('cannot close twice', () => {
      const attention = openAtTable();
      attention.close(0, catalog.defaultFor(CLOSED));
      expect(() => attention.close(0, catalog.defaultFor(CLOSED))).toThrow(
        AttentionNotActiveError,
      );
    });
  });

  describe('cancel', () => {
    it('cancels an unpaid attention and keeps the reason', () => {
      const attention = openAtTable();
      attention.cancel('Customer left', 0, catalog.defaultFor(CANCELLED));
      expect(attention.status).toBe(CANCELLED);
      expect(attention.cancelledAt).toBeInstanceOf(Date);
      expect(attention.cancellationReason).toBe('Customer left');
      expect(attention.isActive).toBe(false);
    });

    it('refuses to cancel an attention with payments', () => {
      const attention = openAtTable();
      expect(() =>
        attention.cancel('Customer left', 10, catalog.defaultFor(CANCELLED)),
      ).toThrow(AttentionHasPaymentsError);
      expect(attention.status).toBe(OPEN);
      expect(attention.cancellationReason).toBeNull();
    });

    it('only accepts a CANCELLED status', () => {
      const attention = openAtTable();
      expect(() =>
        attention.cancel('x', 0, catalog.defaultFor(CLOSED)),
      ).toThrow(/Expected a CANCELLED status/);
    });

    it('cannot cancel a closed attention', () => {
      const attention = openAtTable();
      attention.close(0, catalog.defaultFor(CLOSED));
      expect(() =>
        attention.cancel('x', 0, catalog.defaultFor(CANCELLED)),
      ).toThrow(AttentionNotActiveError);
    });
  });

  it('uses a restaurant-specific status of the same canonical state', () => {
    const custom = WorkflowStatus.create(ATTENTION_WORKFLOW, {
      id: 'status-WAITING_CHECK',
      restaurantId: 'r1',
      code: 'WAITING_CHECK',
      name: 'Esperando cuenta',
      canonicalState: BILL_REQUESTED,
      sortOrder: 5,
    });
    const withCustom = new StatusCatalog(ATTENTION_WORKFLOW, 'r1', [
      ...statuses,
      custom,
    ]);
    const attention = openAtTable();
    attention.requestBill(withCustom.defaultFor(BILL_REQUESTED));
    expect(attention.status).toBe(BILL_REQUESTED);
    expect(attention.statusId).toBe('status-WAITING_CHECK');
  });
});

describe('Attention closing balance', () => {
  it('compares the balance in cents, so float noise is not a debt', () => {
    const attention = openAtTable();
    attention.close(1e-15, catalog.defaultFor(AttentionStatus.CLOSED));
    expect(attention.status).toBe(AttentionStatus.CLOSED);
  });

  it('still refuses a real outstanding cent', () => {
    const attention = openAtTable();
    expect(() =>
      attention.close(0.01, catalog.defaultFor(AttentionStatus.CLOSED)),
    ).toThrow(OutstandingBalanceError);
  });
});
