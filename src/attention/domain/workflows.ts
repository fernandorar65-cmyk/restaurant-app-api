import { AttentionStatus } from './enums/attention-status.enum.js';
import { OrderStatus } from './enums/order-status.enum.js';

/** The two configurable status catalogs a restaurant owns. */
export enum WorkflowKind {
  ATTENTION = 'ATTENTION',
  ORDER = 'ORDER',
}

/**
 * What the backend fixes about a cycle, whatever names the restaurant uses:
 * the canonical states, which one starts the cycle and which ones end it.
 */
export interface WorkflowDefinition<C extends string> {
  kind: WorkflowKind;
  canonicalStates: readonly C[];
  initial: C;
  finals: readonly C[];
}

export const ATTENTION_WORKFLOW: WorkflowDefinition<AttentionStatus> = {
  kind: WorkflowKind.ATTENTION,
  canonicalStates: Object.values(AttentionStatus),
  initial: AttentionStatus.OPEN,
  finals: [AttentionStatus.CLOSED, AttentionStatus.CANCELLED],
};

export const ORDER_WORKFLOW: WorkflowDefinition<OrderStatus> = {
  kind: WorkflowKind.ORDER,
  canonicalStates: Object.values(OrderStatus),
  initial: OrderStatus.SUBMITTED,
  finals: [OrderStatus.SERVED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
};

/** A status row as the attention/order/item references it. */
export interface StatusRef<C extends string> {
  id: string;
  canonicalState: C;
}

export interface WorkflowStatusSeed<C extends string> {
  code: string;
  name: string;
  canonicalState: C;
  color: string;
  sortOrder: number;
}

/** Created for every restaurant (seeds are idempotent by code). */
export const DEFAULT_ATTENTION_STATUSES: WorkflowStatusSeed<AttentionStatus>[] =
  [
    {
      code: 'OPEN',
      name: 'Abierta',
      canonicalState: AttentionStatus.OPEN,
      color: '#2563EB',
      sortOrder: 10,
    },
    {
      code: 'BILL_REQUESTED',
      name: 'Cuenta solicitada',
      canonicalState: AttentionStatus.BILL_REQUESTED,
      color: '#D97706',
      sortOrder: 20,
    },
    {
      code: 'CLOSED',
      name: 'Cerrada',
      canonicalState: AttentionStatus.CLOSED,
      color: '#16A34A',
      sortOrder: 30,
    },
    {
      code: 'CANCELLED',
      name: 'Cancelada',
      canonicalState: AttentionStatus.CANCELLED,
      color: '#DC2626',
      sortOrder: 40,
    },
  ];

export const DEFAULT_ORDER_STATUSES: WorkflowStatusSeed<OrderStatus>[] = [
  {
    code: 'SUBMITTED',
    name: 'Enviado',
    canonicalState: OrderStatus.SUBMITTED,
    color: '#64748B',
    sortOrder: 10,
  },
  {
    code: 'CONFIRMED',
    name: 'Confirmado',
    canonicalState: OrderStatus.CONFIRMED,
    color: '#2563EB',
    sortOrder: 20,
  },
  {
    code: 'IN_PREPARATION',
    name: 'En preparación',
    canonicalState: OrderStatus.IN_PREPARATION,
    color: '#D97706',
    sortOrder: 30,
  },
  {
    code: 'READY',
    name: 'Listo',
    canonicalState: OrderStatus.READY,
    color: '#7C3AED',
    sortOrder: 40,
  },
  {
    code: 'SERVED',
    name: 'Servido',
    canonicalState: OrderStatus.SERVED,
    color: '#16A34A',
    sortOrder: 50,
  },
  {
    code: 'REJECTED',
    name: 'Rechazado',
    canonicalState: OrderStatus.REJECTED,
    color: '#B91C1C',
    sortOrder: 60,
  },
  {
    code: 'CANCELLED',
    name: 'Cancelado',
    canonicalState: OrderStatus.CANCELLED,
    color: '#DC2626',
    sortOrder: 70,
  },
];
