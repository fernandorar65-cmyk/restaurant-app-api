import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { roundMoney } from '../../../../../common/domain/value-objects/money.js';
import {
  transactionalRepository,
  withoutUndefined,
} from '../../../../../common/persistence/typeorm-base.repository.js';
import { TypeOrmTransactionContext } from '../../../../../common/persistence/typeorm-transaction-runner.js';
import { Payment } from '../../../../domain/entities/payment.entity.js';
import { AllocationConcept } from '../../../../domain/enums/allocation-concept.enum.js';
import type { PaymentStatusCode } from '../../../../domain/enums/payment-status-code.enum.js';
import { DuplicatePaymentRequestError } from '../../../../domain/exceptions/payment.errors.js';
import type {
  AllocationTotals,
  PaymentFilter,
  PaymentRepository,
} from '../../../../domain/repositories/payment.repository.js';
import { PaymentAllocationOrmEntity } from '../entities/payment-allocation.orm-entity.js';
import { PaymentStatusOrmEntity } from '../entities/payment-status.orm-entity.js';
import { PaymentOrmEntity } from '../entities/payment.orm-entity.js';
import { PaymentMapper } from '../mappers/payment.mappers.js';

const WITH_ALLOCATIONS = { allocations: true } as const;

@Injectable()
export class TypeOrmPaymentRepository implements PaymentRepository {
  constructor(
    @InjectRepository(PaymentOrmEntity)
    private readonly payments: Repository<PaymentOrmEntity>,
    @InjectRepository(PaymentAllocationOrmEntity)
    private readonly allocations: Repository<PaymentAllocationOrmEntity>,
    @InjectRepository(PaymentStatusOrmEntity)
    private readonly statuses: Repository<PaymentStatusOrmEntity>,
  ) {}

  async findById(id: string, tx?: TransactionContext): Promise<Payment | null> {
    const found = await transactionalRepository(this.payments, tx).findOne({
      where: { id },
      relations: WITH_ALLOCATIONS,
    });
    return found ? PaymentMapper.toDomain(found) : null;
  }

  async findByIdForUpdate(id: string, tx: TransactionContext): Promise<Payment | null> {
    // Lock only the payment row (FOR UPDATE can't be used with outer joins).
    const locked = await transactionalRepository(this.payments, tx)
      .createQueryBuilder('payment')
      .select('payment.id')
      .where('payment.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();
    return locked ? this.findById(id, tx) : null;
  }

  async findByRequestId(restaurantId: string, requestId: string): Promise<Payment | null> {
    const found = await this.payments.findOne({
      where: { restaurantId, requestId },
      relations: WITH_ALLOCATIONS,
    });
    return found ? PaymentMapper.toDomain(found) : null;
  }

  async findByProviderPaymentId(
    providerCode: string,
    providerPaymentId: string,
    tx?: TransactionContext,
  ): Promise<Payment | null> {
    const found = await transactionalRepository(this.payments, tx).findOne({
      where: { providerCode, providerPaymentId },
      relations: WITH_ALLOCATIONS,
    });
    return found ? PaymentMapper.toDomain(found) : null;
  }

  async findPage(filter: PaymentFilter, page: PageRequest): Promise<Page<Payment>> {
    const [rows, total] = await this.payments.findAndCount({
      where: withoutUndefined({
        attentionId: filter.attentionId,
        restaurantId: filter.restaurantId,
        status: filter.status ? { code: filter.status } : undefined,
      }),
      relations: WITH_ALLOCATIONS,
      order: { createdAt: 'DESC' },
      skip: (page.page - 1) * page.limit,
      take: page.limit,
    });
    return {
      items: rows.map((row) => PaymentMapper.toDomain(row)),
      total,
      page: page.page,
      limit: page.limit,
    };
  }

  async insert(payment: Payment, tx: TransactionContext): Promise<void> {
    const statusId = await this.statusId(payment.status, tx);
    try {
      await transactionalRepository(this.payments, tx).insert(
        PaymentMapper.toPersistence(payment, statusId),
      );
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { constraint?: string }).constraint ===
          'uq_payments_restaurant_request'
      ) {
        throw new DuplicatePaymentRequestError(payment.requestId);
      }
      throw error;
    }
    await transactionalRepository(this.allocations, tx).insert(
      PaymentMapper.allocationsToPersistence(payment),
    );
  }

  async updateStatus(payment: Payment, tx?: TransactionContext): Promise<void> {
    await transactionalRepository(this.payments, tx).update(
      { id: payment.id },
      {
        paymentStatusId: await this.statusId(payment.status, tx),
        paidAt: payment.paidAt,
        providerStatus: payment.provider?.status ?? null,
      },
    );
  }

  async lockAttention(attentionId: string, tx: TransactionContext): Promise<void> {
    const manager = (tx as TypeOrmTransactionContext).manager;
    await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      `payments:attention:${attentionId}`,
    ]);
  }

  async allocationTotals(
    attentionId: string,
    tx?: TransactionContext,
  ): Promise<AllocationTotals[]> {
    const rows = await transactionalRepository(this.allocations, tx)
      .createQueryBuilder('allocation')
      .innerJoin('allocation.payment', 'payment')
      .innerJoin('payment.status', 'status')
      .select('allocation.concept', 'concept')
      .addSelect('allocation.order_item_id', 'orderItemId')
      .addSelect(
        'COALESCE(SUM(allocation.allocated_amount) FILTER (WHERE status.counts_toward_balance), 0)',
        'counted',
      )
      .addSelect(
        'COALESCE(SUM(allocation.allocated_amount) FILTER (WHERE NOT status.counts_toward_balance AND NOT status.is_terminal), 0)',
        'reserved',
      )
      .where('payment.attention_id = :attentionId', { attentionId })
      .groupBy('allocation.concept')
      .addGroupBy('allocation.order_item_id')
      .getRawMany<{ concept: AllocationConcept; orderItemId: string | null; counted: string; reserved: string }>();
    return rows.map((row) => ({
      concept: row.concept,
      orderItemId: row.orderItemId,
      counted: roundMoney(Number(row.counted)),
      reserved: roundMoney(Number(row.reserved)),
    }));
  }

  private async statusId(code: PaymentStatusCode, tx?: TransactionContext): Promise<string> {
    const status = await transactionalRepository(this.statuses, tx).findOneOrFail({
      where: { code },
    });
    return status.id;
  }
}
