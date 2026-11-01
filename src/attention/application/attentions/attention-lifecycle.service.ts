import { Inject, Injectable } from '@nestjs/common';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { Attention } from '../../domain/entities/attention.entity.js';
import { Fulfillment } from '../../domain/entities/fulfillment.entity.js';
import { AttentionStatus } from '../../domain/enums/attention-status.enum.js';
import { FulfillmentStatus } from '../../domain/enums/fulfillment-status.enum.js';
import { FulfillmentNotFoundError } from '../../domain/exceptions/attention.errors.js';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';
import { FULFILLMENT_REPOSITORY } from '../../domain/repositories/fulfillment.repository.js';
import type { FulfillmentRepository } from '../../domain/repositories/fulfillment.repository.js';
import { WorkflowStatusesService } from '../attention-settings/workflow-statuses.service.js';
import { PAYMENT_LEDGER } from '../ports/payment-ledger.port.js';
import type { PaymentLedgerPort } from '../ports/payment-ledger.port.js';
import { AttentionQueriesService } from './attention-queries.service.js';
import { lockAttention } from './require-attention.js';

/**
 * From the bill request to closing or cancelling the attention, plus its
 * pickup/delivery flow. Every change locks the attention row first.
 */
@Injectable()
export class AttentionLifecycleService {
  constructor(
    @Inject(ATTENTION_REPOSITORY)
    private readonly attentionRepository: AttentionRepository,
    @Inject(FULFILLMENT_REPOSITORY)
    private readonly fulfillmentRepository: FulfillmentRepository,
    @Inject(PAYMENT_LEDGER) private readonly paymentLedger: PaymentLedgerPort,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    private readonly queries: AttentionQueriesService,
    private readonly statuses: WorkflowStatusesService,
  ) {}

  async requestBill(id: string): Promise<Attention> {
    return this.transactionRunner.run(async (tx) => {
      const attention = await lockAttention(this.attentionRepository, id, tx);
      const statuses = await this.statuses.attentionCatalog(
        attention.restaurantId,
        tx,
      );
      attention.requestBill(
        statuses.defaultFor(AttentionStatus.BILL_REQUESTED),
      );
      return this.attentionRepository.save(attention, tx);
    });
  }

  /**
   * The balance is computed after taking the lock, so an order placed
   * concurrently is either included or rejected because the attention closed.
   */
  async close(id: string): Promise<Attention> {
    return this.transactionRunner.run(async (tx) => {
      const attention = await lockAttention(this.attentionRepository, id, tx);
      const bill = await this.queries.billFor(attention);
      const statuses = await this.statuses.attentionCatalog(
        attention.restaurantId,
        tx,
      );
      attention.close(
        bill.balance,
        statuses.defaultFor(AttentionStatus.CLOSED),
      );
      return this.attentionRepository.save(attention, tx);
    });
  }

  /** Cancelling the attention also cancels its pending pickup/delivery. */
  async cancel(id: string, reason: string): Promise<Attention> {
    return this.transactionRunner.run(async (tx) => {
      const attention = await lockAttention(this.attentionRepository, id, tx);
      const statuses = await this.statuses.attentionCatalog(
        attention.restaurantId,
        tx,
      );
      attention.cancel(
        reason,
        await this.paymentLedger.paidAmount(id),
        statuses.defaultFor(AttentionStatus.CANCELLED),
      );
      const fulfillment = await this.fulfillmentRepository.findByAttention(
        id,
        tx,
      );
      if (fulfillment && !fulfillment.isFinal) {
        fulfillment.changeStatus(FulfillmentStatus.CANCELLED);
        await this.fulfillmentRepository.save(fulfillment, tx);
      }
      return this.attentionRepository.save(attention, tx);
    });
  }

  /**
   * Moves the pickup/delivery through its flow (see Fulfillment). It belongs
   * to the attention's consistency boundary: the attention row is locked
   * first, so it can't race with cancel(), which cancels it. The attention
   * doesn't need to be active: a delivery may complete after it was paid.
   */
  async changeFulfillmentStatus(
    attentionId: string,
    input: { status: FulfillmentStatus; estimatedReadyAt?: Date | null },
  ): Promise<Fulfillment> {
    return this.transactionRunner.run(async (tx) => {
      await lockAttention(this.attentionRepository, attentionId, tx);
      const fulfillment = await this.fulfillmentRepository.findByAttention(
        attentionId,
        tx,
      );
      if (!fulfillment) {
        throw new FulfillmentNotFoundError(attentionId);
      }
      fulfillment.changeStatus(input.status, {
        estimatedReadyAt: input.estimatedReadyAt,
      });
      return this.fulfillmentRepository.save(fulfillment, tx);
    });
  }
}
