import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { WorkflowStatus } from '../entities/workflow-status.entity.js';
import type { WorkflowStatusSeed } from '../workflows.js';

export const ATTENTION_STATUS_REPOSITORY = Symbol(
  'ATTENTION_STATUS_REPOSITORY',
);
export const ORDER_STATUS_REPOSITORY = Symbol('ORDER_STATUS_REPOSITORY');

/** Same contract for attention_statuses and order_statuses. */
export interface WorkflowStatusRepository<C extends string> {
  findById(
    id: string,
    tx?: TransactionContext,
  ): Promise<WorkflowStatus<C> | null>;
  /** Active and inactive statuses, by sort_order. */
  findByRestaurant(
    restaurantId: string,
    tx?: TransactionContext,
  ): Promise<WorkflowStatus<C>[]>;
  /** Throws DuplicateWorkflowStatusCodeError when the code is taken. */
  save(
    status: WorkflowStatus<C>,
    tx?: TransactionContext,
  ): Promise<WorkflowStatus<C>>;
  /**
   * Inserts the defaults that are missing by code (idempotent) and makes the
   * initial seed the initial status when the restaurant has none.
   */
  seedDefaults(
    restaurantId: string,
    seeds: WorkflowStatusSeed<C>[],
    tx?: TransactionContext,
  ): Promise<void>;
}
