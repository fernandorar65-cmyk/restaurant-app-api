import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { transactionalRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Fulfillment } from '../../../../domain/entities/fulfillment.entity.js';
import { FulfillmentRepository } from '../../../../domain/repositories/fulfillment.repository.js';
import { FulfillmentOrmEntity } from '../entities/fulfillment.orm-entity.js';
import { FulfillmentMapper } from '../mappers/attention.mappers.js';

@Injectable()
export class TypeOrmFulfillmentRepository implements FulfillmentRepository {
  constructor(
    @InjectRepository(FulfillmentOrmEntity)
    private readonly repository: Repository<FulfillmentOrmEntity>,
  ) {}

  async findByAttention(attentionId: string): Promise<Fulfillment | null> {
    const found = await this.repository.findOne({ where: { attentionId } });
    return found ? FulfillmentMapper.toDomain(found) : null;
  }

  async save(
    fulfillment: Fulfillment,
    tx?: TransactionContext,
  ): Promise<Fulfillment> {
    const repository = transactionalRepository(this.repository, tx);
    const existing = await repository.findOne({ where: { id: fulfillment.id } });
    const saved = await repository.save(
      FulfillmentMapper.toPersistence(fulfillment, existing ?? undefined),
    );
    return FulfillmentMapper.toDomain(saved);
  }
}
