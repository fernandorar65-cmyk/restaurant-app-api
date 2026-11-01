import type { WorkflowStatus } from './entities/workflow-status.entity.js';
import {
  StatusNotConfiguredError,
  WorkflowStatusNotFoundError,
} from './exceptions/attention.errors.js';
import type { StatusRef, WorkflowDefinition } from './workflows.js';

/**
 * The statuses of one restaurant for one cycle, as the backend uses them:
 * when it moves a record to a canonical state on its own (e.g. bill
 * requested, order derived from its items) it picks the first active status
 * of that state by sort_order; when staff pick a status, it must be one of
 * this restaurant's active ones.
 */
export class StatusCatalog<C extends string> {
  constructor(
    private readonly workflow: WorkflowDefinition<C>,
    private readonly restaurantId: string,
    private readonly statuses: WorkflowStatus<C>[],
  ) {}

  initial(): StatusRef<C> {
    const initial = this.statuses.find(
      (status) => status.isActive && status.isInitial,
    );
    if (!initial) {
      throw new StatusNotConfiguredError(
        this.workflow.kind,
        this.workflow.initial,
      );
    }
    return initial.ref;
  }

  defaultFor(canonicalState: C): StatusRef<C> {
    const candidates = this.statuses
      .filter(
        (status) => status.isActive && status.canonicalState === canonicalState,
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (candidates.length === 0) {
      throw new StatusNotConfiguredError(this.workflow.kind, canonicalState);
    }
    return candidates[0].ref;
  }

  /** A status chosen by id: it must belong to this restaurant and be active. */
  require(statusId: string): StatusRef<C> {
    const status = this.statuses.find(
      (candidate) =>
        candidate.id === statusId &&
        candidate.restaurantId === this.restaurantId,
    );
    if (!status || !status.isActive) {
      throw new WorkflowStatusNotFoundError(statusId);
    }
    return status.ref;
  }
}
