import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { OrderBatch } from '../../../../domain/entities/order-batch.entity.js';
import { DuplicateRoundRequestError } from '../../../../domain/exceptions/attention.errors.js';
import { OrderBatchRepository } from '../../../../domain/repositories/order-batch.repository.js';
import { OrderBatchOrmEntity } from '../entities/order-batch.orm-entity.js';
import { OrderBatchMapper } from '../mappers/attention.mappers.js';

@Injectable()
export class TypeOrmOrderBatchRepository
  extends TypeOrmBaseRepository<OrderBatch, OrderBatchOrmEntity>
  implements OrderBatchRepository
{
  constructor(
    @InjectRepository(OrderBatchOrmEntity)
    repository: Repository<OrderBatchOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: OrderBatchOrmEntity): OrderBatch {
    return OrderBatchMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: OrderBatch,
    existing?: OrderBatchOrmEntity,
  ): OrderBatchOrmEntity {
    return OrderBatchMapper.toPersistence(domain, existing);
  }

  async findByRequestId(
    attentionId: string,
    requestId: string,
    tx?: TransactionContext,
  ): Promise<OrderBatch | null> {
    const found = await this.getRepository(tx).findOne({
      where: { attentionId, requestId },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByAttention(attentionId: string): Promise<OrderBatch[]> {
    const rows = await this.repository.find({
      where: { attentionId },
      order: { submittedAt: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  override async save(batch: OrderBatch, tx?: TransactionContext): Promise<OrderBatch> {
    try {
      return await super.save(batch, tx);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { constraint?: string }).constraint ===
          'uq_batches_attention_request'
      ) {
        throw new DuplicateRoundRequestError(batch.requestId);
      }
      throw error;
    }
  }
}
