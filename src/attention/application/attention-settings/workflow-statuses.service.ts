import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { WorkflowStatus } from '../../domain/entities/workflow-status.entity.js';
import type { AttentionStatus } from '../../domain/enums/attention-status.enum.js';
import type { OrderStatus } from '../../domain/enums/order-status.enum.js';
import {
  RequiredWorkflowStatusError,
  WorkflowStatusNotFoundError,
} from '../../domain/exceptions/attention.errors.js';
import {
  ATTENTION_STATUS_REPOSITORY,
  ORDER_STATUS_REPOSITORY,
} from '../../domain/repositories/workflow-status.repository.js';
import type { WorkflowStatusRepository } from '../../domain/repositories/workflow-status.repository.js';
import { StatusCatalog } from '../../domain/status-catalog.js';
import {
  ATTENTION_WORKFLOW,
  DEFAULT_ATTENTION_STATUSES,
  DEFAULT_ORDER_STATUSES,
  ORDER_WORKFLOW,
  WorkflowKind,
  type WorkflowDefinition,
} from '../../domain/workflows.js';

export interface CreateWorkflowStatusInput {
  restaurantId: string;
  code: string;
  name: string;
  canonicalState: string;
  color?: string | null;
  sortOrder: number;
  isInitial?: boolean;
}

export interface UpdateWorkflowStatusInput {
  code?: string;
  name?: string;
  color?: string | null;
  sortOrder?: number;
  /** true makes it the initial status (the previous one stops being it). */
  isInitial?: boolean;
  isActive?: boolean;
}

type AnyStatus = WorkflowStatus<string>;

/**
 * Each restaurant's attention and order status catalogs. Restaurants name,
 * color and order their statuses freely; what the backend needs is kept:
 * exactly one active initial status and at least one active status per
 * canonical state (it moves records there on its own).
 */
@Injectable()
export class WorkflowStatusesService {
  constructor(
    @Inject(ATTENTION_STATUS_REPOSITORY)
    private readonly attentionStatuses: WorkflowStatusRepository<AttentionStatus>,
    @Inject(ORDER_STATUS_REPOSITORY)
    private readonly orderStatuses: WorkflowStatusRepository<OrderStatus>,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
  ) {}

  async attentionCatalog(
    restaurantId: string,
    tx?: TransactionContext,
  ): Promise<StatusCatalog<AttentionStatus>> {
    return new StatusCatalog(
      ATTENTION_WORKFLOW,
      restaurantId,
      await this.attentionStatuses.findByRestaurant(restaurantId, tx),
    );
  }

  async orderCatalog(
    restaurantId: string,
    tx?: TransactionContext,
  ): Promise<StatusCatalog<OrderStatus>> {
    return new StatusCatalog(
      ORDER_WORKFLOW,
      restaurantId,
      await this.orderStatuses.findByRestaurant(restaurantId, tx),
    );
  }

  /** Idempotent: only the default codes that are missing are inserted. */
  async seedDefaults(
    restaurantId: string,
    tx?: TransactionContext,
  ): Promise<void> {
    await this.attentionStatuses.seedDefaults(
      restaurantId,
      DEFAULT_ATTENTION_STATUSES,
      tx,
    );
    await this.orderStatuses.seedDefaults(
      restaurantId,
      DEFAULT_ORDER_STATUSES,
      tx,
    );
  }

  list(kind: WorkflowKind, restaurantId: string): Promise<AnyStatus[]> {
    return this.repository(kind).findByRestaurant(restaurantId);
  }

  async findOne(kind: WorkflowKind, id: string): Promise<AnyStatus> {
    const status = await this.repository(kind).findById(id);
    if (!status) {
      throw new WorkflowStatusNotFoundError(id);
    }
    return status;
  }

  async create(
    kind: WorkflowKind,
    input: CreateWorkflowStatusInput,
  ): Promise<AnyStatus> {
    const status = WorkflowStatus.create(this.workflow(kind), {
      id: randomUUID(),
      restaurantId: input.restaurantId,
      code: input.code,
      name: input.name,
      canonicalState: input.canonicalState,
      color: input.color,
      sortOrder: input.sortOrder,
    });
    return this.transactionRunner.run(async (tx) => {
      const saved = await this.repository(kind).save(status, tx);
      return input.isInitial ? this.makeInitial(kind, saved, tx) : saved;
    });
  }

  async update(
    kind: WorkflowKind,
    id: string,
    input: UpdateWorkflowStatusInput,
  ): Promise<AnyStatus> {
    return this.transactionRunner.run(async (tx) => {
      const repository = this.repository(kind);
      const status = await repository.findById(id, tx);
      if (!status) {
        throw new WorkflowStatusNotFoundError(id);
      }
      status.update(input);
      if (input.isActive === true) {
        status.activate();
      }
      if (input.isActive === false && status.isActive) {
        await this.assertCanDeactivate(kind, status, tx);
        status.deactivate();
      }
      if (input.isInitial === false && status.isInitial) {
        throw new RequiredWorkflowStatusError(
          'Debe haber un estado inicial: marca otro estado como inicial',
        );
      }
      const saved = await repository.save(status, tx);
      return input.isInitial && !saved.isInitial
        ? this.makeInitial(kind, saved, tx)
        : saved;
    });
  }

  /** The previous initial status is unmarked first (one initial per restaurant). */
  private async makeInitial(
    kind: WorkflowKind,
    status: AnyStatus,
    tx: TransactionContext,
  ): Promise<AnyStatus> {
    const repository = this.repository(kind);
    const siblings = await repository.findByRestaurant(status.restaurantId, tx);
    for (const sibling of siblings.filter(
      (other) => other.isInitial && other.id !== status.id,
    )) {
      sibling.unmarkInitial();
      await repository.save(sibling, tx);
    }
    status.markInitial();
    return repository.save(status, tx);
  }

  private async assertCanDeactivate(
    kind: WorkflowKind,
    status: AnyStatus,
    tx: TransactionContext,
  ): Promise<void> {
    if (status.isInitial) {
      throw new RequiredWorkflowStatusError(
        'No se puede desactivar el estado inicial: marca otro estado como inicial primero',
      );
    }
    const siblings = await this.repository(kind).findByRestaurant(
      status.restaurantId,
      tx,
    );
    const others = siblings.filter(
      (other) =>
        other.id !== status.id &&
        other.isActive &&
        other.canonicalState === status.canonicalState,
    );
    if (others.length === 0) {
      throw new RequiredWorkflowStatusError(
        `Es el único estado activo ${status.canonicalState}; crea o activa otro antes de desactivarlo`,
      );
    }
  }

  private repository(kind: WorkflowKind): WorkflowStatusRepository<string> {
    return kind === WorkflowKind.ATTENTION
      ? this.attentionStatuses
      : this.orderStatuses;
  }

  private workflow(kind: WorkflowKind): WorkflowDefinition<string> {
    return kind === WorkflowKind.ATTENTION
      ? ATTENTION_WORKFLOW
      : ORDER_WORKFLOW;
  }
}
