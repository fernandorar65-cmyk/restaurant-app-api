import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { QueryFailedError, Repository } from 'typeorm';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { transactionalRepository } from '../../../../../common/infrastructure/persistence/typeorm-base.repository.js';
import { WorkflowStatus } from '../../../../domain/entities/workflow-status.entity.js';
import { AttentionStatus } from '../../../../domain/enums/attention-status.enum.js';
import { OrderStatus } from '../../../../domain/enums/order-status.enum.js';
import { DuplicateWorkflowStatusCodeError } from '../../../../domain/exceptions/attention.errors.js';
import type { WorkflowStatusRepository } from '../../../../domain/repositories/workflow-status.repository.js';
import {
  ATTENTION_WORKFLOW,
  ORDER_WORKFLOW,
  type WorkflowDefinition,
  type WorkflowStatusSeed,
} from '../../../../domain/workflows.js';
import {
  AttentionStatusOrmEntity,
  OrderStatusOrmEntity,
} from '../entities/workflow-status.orm-entity.js';
import { WorkflowStatusMapper } from '../mappers/attention.mappers.js';

type StatusOrm = AttentionStatusOrmEntity | OrderStatusOrmEntity;

abstract class TypeOrmWorkflowStatusRepository<
  C extends string,
  T extends StatusOrm,
> implements WorkflowStatusRepository<C> {
  constructor(
    private readonly workflow: WorkflowDefinition<C>,
    private readonly repository: Repository<T>,
    private readonly create: () => T,
  ) {}

  async findById(
    id: string,
    tx?: TransactionContext,
  ): Promise<WorkflowStatus<C> | null> {
    const found = await transactionalRepository(this.repository, tx).findOne({
      where: { id } as never,
    });
    return found ? WorkflowStatusMapper.toDomain(this.workflow, found) : null;
  }

  async findByRestaurant(
    restaurantId: string,
    tx?: TransactionContext,
  ): Promise<WorkflowStatus<C>[]> {
    const rows = await transactionalRepository(this.repository, tx).find({
      where: { restaurantId } as never,
      order: { sortOrder: 'ASC', code: 'ASC' } as never,
    });
    return rows.map((row) => WorkflowStatusMapper.toDomain(this.workflow, row));
  }

  async save(
    status: WorkflowStatus<C>,
    tx?: TransactionContext,
  ): Promise<WorkflowStatus<C>> {
    try {
      const saved = await transactionalRepository(this.repository, tx).save(
        WorkflowStatusMapper.toPersistence(status, this.create()),
      );
      return WorkflowStatusMapper.toDomain(this.workflow, saved);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { constraint?: string }).constraint?.endsWith(
          '_restaurant_code',
        )
      ) {
        throw new DuplicateWorkflowStatusCodeError(status.code);
      }
      throw error;
    }
  }

  async seedDefaults(
    restaurantId: string,
    seeds: WorkflowStatusSeed<C>[],
    tx?: TransactionContext,
  ): Promise<void> {
    const repository = transactionalRepository(this.repository, tx);
    const hasInitial = await repository.exists({
      where: { restaurantId, isInitial: true, isActive: true } as never,
    });
    await repository
      .createQueryBuilder()
      .insert()
      .values(
        seeds.map((seed) => ({
          id: randomUUID(),
          restaurantId,
          code: seed.code,
          name: seed.name,
          canonicalState: seed.canonicalState,
          color: seed.color,
          sortOrder: seed.sortOrder,
          isInitial:
            !hasInitial && seed.canonicalState === this.workflow.initial,
          isFinal: this.workflow.finals.includes(seed.canonicalState),
          isActive: true,
        })) as never,
      )
      .orIgnore()
      .execute();
  }
}

@Injectable()
export class TypeOrmAttentionStatusRepository extends TypeOrmWorkflowStatusRepository<
  AttentionStatus,
  AttentionStatusOrmEntity
> {
  constructor(
    @InjectRepository(AttentionStatusOrmEntity)
    repository: Repository<AttentionStatusOrmEntity>,
  ) {
    super(ATTENTION_WORKFLOW, repository, () => new AttentionStatusOrmEntity());
  }
}

@Injectable()
export class TypeOrmOrderStatusRepository extends TypeOrmWorkflowStatusRepository<
  OrderStatus,
  OrderStatusOrmEntity
> {
  constructor(
    @InjectRepository(OrderStatusOrmEntity)
    repository: Repository<OrderStatusOrmEntity>,
  ) {
    super(ORDER_WORKFLOW, repository, () => new OrderStatusOrmEntity());
  }
}
