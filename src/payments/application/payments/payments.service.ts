import { Inject, Injectable } from '@nestjs/common';
import type {
  Page,
  PageRequest,
} from '../../../common/domain/pagination.js';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Payment } from '../../domain/entities/payment.entity.js';
import { PaymentStatusCode } from '../../domain/enums/payment-status-code.enum.js';
import {
  PaymentNotCancellableError,
  PaymentNotFoundError,
} from '../../domain/exceptions/payment.errors.js';
import { PAYMENT_REPOSITORY } from '../../domain/repositories/payment.repository.js';
import type {
  PaymentFilter,
  PaymentRepository,
} from '../../domain/repositories/payment.repository.js';
import { summarizeBalance } from '../../domain/services/charge-lines.js';
import type { BalanceSummary } from '../../domain/services/charge-lines.js';
import { ATTENTION_BILLING } from '../ports/attention-billing.port.js';
import type { AttentionBillingPort } from '../ports/attention-billing.port.js';
import { requireBill } from './require-bill.js';
import { requirePayment } from './require-payment.js';

export type { ChargeLineBalance } from '../../domain/services/charge-lines.js';

export interface AttentionBalance extends BalanceSummary {
  attentionId: string;
  currencyCode: string;
}

/** Payment reads, the balance of an attention and abandoning an attempt. */
@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
    @Inject(ATTENTION_BILLING)
    private readonly attentionBilling: AttentionBillingPort,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
  ) {}

  findPage(filter: PaymentFilter, page: PageRequest): Promise<Page<Payment>> {
    return this.paymentRepository.findPage(filter, page);
  }

  findOne(id: string, tx?: TransactionContext): Promise<Payment> {
    return requirePayment(this.paymentRepository, id, tx);
  }

  /** Abandons an attempt that never completed; it stops reserving the balance. */
  async cancel(id: string): Promise<Payment> {
    await this.transactionRunner.run(async (tx) => {
      const payment = await this.paymentRepository.findByIdForUpdate(id, tx);
      if (!payment) {
        throw new PaymentNotFoundError(id);
      }
      if (payment.status === PaymentStatusCode.CANCELLED) {
        return;
      }
      if (
        payment.status !== PaymentStatusCode.PENDING &&
        payment.status !== PaymentStatusCode.PROCESSING
      ) {
        throw new PaymentNotCancellableError(payment.status);
      }
      payment.changeStatus(PaymentStatusCode.CANCELLED);
      await this.paymentRepository.updateStatus(payment, tx);
    });
    return this.findOne(id);
  }

  /** What is owed per product (and delivery fee): total, paid, reserved and outstanding. */
  async balance(attentionId: string): Promise<AttentionBalance> {
    const bill = await requireBill(this.attentionBilling, attentionId);
    const totals = await this.paymentRepository.allocationTotals(attentionId);
    return {
      attentionId,
      currencyCode: bill.currencyCode,
      ...summarizeBalance(bill, totals),
    };
  }
}
