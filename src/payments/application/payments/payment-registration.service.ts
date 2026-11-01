import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import type { PaymentMethod } from '../../../common/domain/payment-method.enum.js';
import { Payment } from '../../domain/entities/payment.entity.js';
import { normalizeProviderCode } from '../../domain/entities/provider-status-mapping.entity.js';
import { AllocationMode } from '../../domain/enums/allocation-mode.enum.js';
import { PaymentStatusCode } from '../../domain/enums/payment-status-code.enum.js';
import {
  AttentionNotPayableError,
  DuplicatePaymentRequestError,
  DuplicateProviderPaymentError,
  UnmappedProviderStatusError,
} from '../../domain/exceptions/payment.errors.js';
import { PROVIDER_STATUS_MAPPING_REPOSITORY } from '../../domain/repositories/payment-catalog.repository.js';
import type { ProviderStatusMappingRepository } from '../../domain/repositories/payment-catalog.repository.js';
import { PAYMENT_REPOSITORY } from '../../domain/repositories/payment.repository.js';
import type { PaymentRepository } from '../../domain/repositories/payment.repository.js';
import {
  planAllocations,
  sumAllocations,
} from '../../domain/services/allocation-planner.js';
import type { RequestedAllocation } from '../../domain/services/allocation-planner.js';
import {
  allocationRequestFor,
  buildChargeLines,
} from '../../domain/services/charge-lines.js';
import { REFUND_STATUSES_DISABLED } from '../../domain/status-catalog.js';
import { ATTENTION_BILLING } from '../ports/attention-billing.port.js';
import type { AttentionBillingPort } from '../ports/attention-billing.port.js';
import { requireBill } from './require-bill.js';
import { requirePayment } from './require-payment.js';

export interface RegisterPaymentInput {
  attentionId: string;
  /** Idempotency key, unique per restaurant. */
  requestId: string;
  method: PaymentMethod;
  mode: AllocationMode;
  /** Only for AMOUNT. FULL and ITEMS amounts are computed by the server. */
  amount?: number;
  /** Only for ITEMS. */
  allocations?: RequestedAllocation[];
  payerUserId?: string | null;
  payerName?: string | null;
  externalReference?: string | null;
  notes?: string | null;
  /** Gateway data; without it the payment is a confirmed manual one. */
  provider?: {
    code: string;
    paymentId?: string | null;
    status?: string | null;
  };
  registeredByUserId?: string | null;
}

export interface RegisterPaymentResult {
  payment: Payment;
  /** False when the requestId had already been processed. */
  created: boolean;
}

@Injectable()
export class PaymentRegistrationService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
    @Inject(PROVIDER_STATUS_MAPPING_REPOSITORY)
    private readonly mappingRepository: ProviderStatusMappingRepository,
    @Inject(ATTENTION_BILLING)
    private readonly attentionBilling: AttentionBillingPort,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
  ) {}

  /**
   * Registers a payment and its allocations. Amounts are always computed or
   * validated on the server against what is still owed; the balance is
   * recalculated under a per-attention lock so concurrent payments can't
   * collect more than the debt. Idempotent by requestId.
   */
  async register(input: RegisterPaymentInput): Promise<RegisterPaymentResult> {
    const bill = await requireBill(this.attentionBilling, input.attentionId);
    const previous = await this.paymentRepository.findByRequestId(
      bill.restaurantId,
      input.requestId,
    );
    if (previous) {
      return { payment: previous, created: false };
    }
    if (!bill.isActive) {
      throw new AttentionNotPayableError(bill.status);
    }
    const provider = await this.resolveProvider(input.provider);
    const request = allocationRequestFor(input.mode, input);

    try {
      const payment = await this.transactionRunner.run(async (tx) => {
        await this.paymentRepository.lockAttention(bill.attentionId, tx);
        const totals = await this.paymentRepository.allocationTotals(
          bill.attentionId,
          tx,
        );
        const plan = planAllocations(buildChargeLines(bill, totals), request);
        const created = Payment.create({
          id: randomUUID(),
          organizationId: bill.organizationId,
          restaurantId: bill.restaurantId,
          attentionId: bill.attentionId,
          status: provider?.status ?? PaymentStatusCode.PAID,
          method: input.method,
          mode: input.mode,
          amount: sumAllocations(plan),
          currencyCode: bill.currencyCode,
          payerUserId: input.payerUserId ?? null,
          payerName: input.payerName?.trim() || null,
          externalReference: input.externalReference?.trim() || null,
          provider: provider?.data ?? null,
          requestId: input.requestId,
          notes: input.notes ?? null,
          registeredByUserId: input.registeredByUserId ?? null,
          allocations: plan.map((allocation) => ({
            id: randomUUID(),
            ...allocation,
          })),
        });
        await this.paymentRepository.insert(created, tx);
        return created;
      });
      return {
        payment: await requirePayment(this.paymentRepository, payment.id),
        created: true,
      };
    } catch (error) {
      // A concurrent request with the same id won the race: return its payment.
      if (error instanceof DuplicatePaymentRequestError) {
        const winner = await this.paymentRepository.findByRequestId(
          bill.restaurantId,
          input.requestId,
        );
        if (winner) {
          return { payment: winner, created: false };
        }
      }
      throw error;
    }
  }

  /**
   * Gateway payments start in the internal status their reported status maps
   * to (PENDING when none was reported yet). The original status is kept.
   */
  private async resolveProvider(
    provider: RegisterPaymentInput['provider'],
  ): Promise<{ status: PaymentStatusCode; data: Payment['provider'] } | null> {
    if (!provider) {
      return null;
    }
    const code = normalizeProviderCode(provider.code);
    const paymentId = provider.paymentId?.trim() || null;
    if (
      paymentId &&
      (await this.paymentRepository.findByProviderPaymentId(code, paymentId))
    ) {
      throw new DuplicateProviderPaymentError(code, paymentId);
    }
    const externalStatus = provider.status?.trim() || null;
    let status = PaymentStatusCode.PENDING;
    if (externalStatus) {
      const mapping = await this.mappingRepository.find(code, externalStatus);
      if (
        !mapping?.isActive ||
        REFUND_STATUSES_DISABLED.includes(mapping.paymentStatus)
      ) {
        throw new UnmappedProviderStatusError(code, externalStatus);
      }
      status = mapping.paymentStatus;
    }
    return { status, data: { code, paymentId, status: externalStatus } };
  }
}
