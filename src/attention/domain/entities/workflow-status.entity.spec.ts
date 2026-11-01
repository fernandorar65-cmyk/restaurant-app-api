import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { AttentionStatus } from '../enums/attention-status.enum.js';
import { OrderStatus } from '../enums/order-status.enum.js';
import {
  ATTENTION_WORKFLOW,
  ORDER_WORKFLOW,
  WorkflowKind,
} from '../workflows.js';
import { WorkflowStatus } from './workflow-status.entity.js';

function attentionStatus(
  overrides: Partial<{
    code: string;
    name: string;
    canonicalState: AttentionStatus;
    color: string | null;
    sortOrder: number;
  }> = {},
): WorkflowStatus<AttentionStatus> {
  return WorkflowStatus.create(ATTENTION_WORKFLOW, {
    id: 'status-1',
    restaurantId: 'r1',
    code: 'OPEN',
    name: 'Abierta',
    canonicalState: AttentionStatus.OPEN,
    sortOrder: 10,
    ...overrides,
  });
}

describe('WorkflowStatus', () => {
  describe('create', () => {
    it('normalizes code, name and color and starts active and not initial', () => {
      const status = attentionStatus({
        code: '  open_now ',
        name: '  Abierta  ',
        color: ' #2563eb ',
      });
      expect(status.kind).toBe(WorkflowKind.ATTENTION);
      expect(status.code).toBe('OPEN_NOW');
      expect(status.name).toBe('Abierta');
      expect(status.color).toBe('#2563EB');
      expect(status.isActive).toBe(true);
      expect(status.isInitial).toBe(false);
      expect(status.ref).toEqual({
        id: 'status-1',
        canonicalState: AttentionStatus.OPEN,
      });
    });

    it.each([undefined, null, '', '   '])('stores no color for %j', (color) => {
      expect(attentionStatus({ color }).color).toBeNull();
    });

    it.each([
      [AttentionStatus.OPEN, false],
      [AttentionStatus.BILL_REQUESTED, false],
      [AttentionStatus.CLOSED, true],
      [AttentionStatus.CANCELLED, true],
    ])('derives isFinal for %s -> %s', (canonicalState, isFinal) => {
      expect(attentionStatus({ canonicalState }).isFinal).toBe(isFinal);
    });

    it('rejects a canonical state that does not belong to the workflow', () => {
      expect(() =>
        WorkflowStatus.create(ORDER_WORKFLOW, {
          id: 's',
          restaurantId: 'r1',
          code: 'OPEN',
          name: 'Abierta',
          canonicalState: AttentionStatus.OPEN as unknown as OrderStatus,
          sortOrder: 1,
        }),
      ).toThrow(ValidationDomainError);
    });

    it.each(['1OPEN', 'OPEN-NOW', 'OPEN NOW', '', '_OPEN', 'A'.repeat(31)])(
      'rejects the code %j',
      (code) => {
        expect(() => attentionStatus({ code })).toThrow(ValidationDomainError);
      },
    );

    it('accepts a 30-character code', () => {
      expect(attentionStatus({ code: 'A'.repeat(30) }).code).toHaveLength(30);
    });

    it.each(['', '  ', 'x'.repeat(101)])('rejects the name %j', (name) => {
      expect(() => attentionStatus({ name })).toThrow(ValidationDomainError);
    });

    it.each(['red', '#FFF', '#GGGGGG', '2563EB'])(
      'rejects the color %j',
      (color) => {
        expect(() => attentionStatus({ color })).toThrow(ValidationDomainError);
      },
    );

    it.each([-1, 1.5, Number.NaN])('rejects the sort order %s', (sortOrder) => {
      expect(() => attentionStatus({ sortOrder })).toThrow(
        ValidationDomainError,
      );
    });

    it('accepts a sort order of 0', () => {
      expect(attentionStatus({ sortOrder: 0 }).sortOrder).toBe(0);
    });
  });

  describe('update', () => {
    it('changes only the given fields, never the canonical state', () => {
      const status = attentionStatus({ color: '#2563EB' });
      status.update({ name: 'Mesa abierta', sortOrder: 3 });
      expect(status.name).toBe('Mesa abierta');
      expect(status.sortOrder).toBe(3);
      expect(status.code).toBe('OPEN');
      expect(status.color).toBe('#2563EB');
      expect(status.canonicalState).toBe(AttentionStatus.OPEN);
    });

    it('normalizes the new code and can clear the color', () => {
      const status = attentionStatus({ color: '#2563EB' });
      status.update({ code: 'in_service', color: null });
      expect(status.code).toBe('IN_SERVICE');
      expect(status.color).toBeNull();
    });

    it('applies the same validation as create', () => {
      const status = attentionStatus();
      expect(() => status.update({ code: 'bad code' })).toThrow(
        ValidationDomainError,
      );
      expect(() => status.update({ name: ' ' })).toThrow(ValidationDomainError);
      expect(() => status.update({ color: 'blue' })).toThrow(
        ValidationDomainError,
      );
      expect(() => status.update({ sortOrder: -2 })).toThrow(
        ValidationDomainError,
      );
    });
  });

  describe('initial flag', () => {
    it('can be set on an active status of the starting state', () => {
      const status = attentionStatus();
      status.markInitial();
      expect(status.isInitial).toBe(true);
      status.unmarkInitial();
      expect(status.isInitial).toBe(false);
    });

    it('cannot be set on another canonical state', () => {
      const status = attentionStatus({
        code: 'CLOSED',
        canonicalState: AttentionStatus.CLOSED,
      });
      expect(() => status.markInitial()).toThrow(ValidationDomainError);
      expect(status.isInitial).toBe(false);
    });

    it('cannot be set on an inactive status', () => {
      const status = attentionStatus();
      status.deactivate();
      expect(() => status.markInitial()).toThrow(ValidationDomainError);
    });
  });

  it('can be deactivated and re-activated', () => {
    const status = attentionStatus();
    status.deactivate();
    expect(status.isActive).toBe(false);
    status.activate();
    expect(status.isActive).toBe(true);
  });
});
