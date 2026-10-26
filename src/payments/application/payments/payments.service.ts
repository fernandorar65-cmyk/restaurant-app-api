import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import type { PaymentMethod } from '../../../common/domain/payment-method.enum.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { roundMoney } from '../../../common/domain/value-objects/money.js';
import { Payment } from '../../domain/entities/payment.entity.js';
import { normalizeProviderCode } from '../../domain/entities/provider-status-mapping.entity.js';
import { AllocationConcept } from '../../domain/enums/allocation-concept.enum.js';
import { AllocationMode } from '../../domain/enums/allocation-mode.enum.js';
import { PaymentStatusCode } from '../../domain/enums/payment-status-code.enum.js';
import {
  AttentionNotPayableError,
  AttentionReferenceNotFoundError,
  DuplicatePaymentRequestError,
  DuplicateProviderPaymentError,
  InvalidPaymentAmountError,
  PaymentNotCancellableError,
  PaymentNotFoundError,
  UnmappedProviderStatusError,
} from '../../domain/exceptions/payment.errors.js';
import { PROVIDER_STATUS_MAPPING_REPOSITORY } from '../../domain/repositories/payment-catalog.repository.js';
import type { ProviderStatusMappingRepository } from '../../domain/repositories/payment-catalog.repository.js';
import { PAYMENT_REPOSITORY } from '../../domain/repositories/payment.repository.js';
import type {
  AllocationTotals,
  PaymentFilter,
  PaymentRepository,
} from '../../domain/repositories/payment.repository.js';
import {
  planAllocations,
  sortChargeLines,
  sumAllocations,
} from '../../domain/services/allocation-planner.js';
import type {
  AllocationRequest,
  ChargeLine,
  RequestedAllocation,
} from '../../domain/services/allocation-planner.js';
import { ATTENTION_BILLING } from '../ports/attention-billing.port.js';
import type {
  AttentionBillingPort,
  AttentionBillingSnapshot,
} from '../ports/attention-billing.port.js';

/** Refunds are not enabled yet, so no flow may move a payment into them. */
export const REFUND_STATUSES_DISABLED = [
  PaymentStatusCode.PARTIALLY_REFUNDED,
  PaymentStatusCode.REFUNDED,
];

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
  provider?: { code: string; paymentId?: string | null; status?: string | null };
  registeredByUserId?: string | null;
}

export interface RegisterPaymentResult {
  payment: Payment;
  /** False when the requestId had already been processed. */
  created: boolean;
}

export interface ChargeLineBalance {
  concept: AllocationConcept;
  orderItemId: string | null;
  label: string;
  total: number;
  /** Confirmed payments. */
  paid: number;
  /** Payments still pending at a gateway. */
  reserved: number;
  outstanding: number;
}

export interface AttentionBalance {
  attentionId: string;
  currencyCode: string;
  total: number;
  paid: number;
  reserved: number;
  outstanding: number;
  lines: ChargeLineBalance[];
}

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepository: PaymentRepository,
    @Inject(PROVIDER_STATUS_MAPPING_REPOSITORY)
    private readonly mappingRepository: ProviderStatusMappingRepository,
    @Inject(ATTENTION_BILLING) private readonly attentionBilling: AttentionBillingPort,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: TransactionRunner,
  ) {}

  /**
   * Registers a payment and its allocations. Amounts are always computed or
   * validated on the server against what is still owed; the balance is
   * recalculated under a per-attention lock so concurrent payments can't
   * collect more than the debt. Idempotent by requestId.
   */
  async register(input: RegisterPaymentInput): Promise<RegisterPaymentResult> {
    const bill = await this.requireBill(input.attentionId);
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
    const request = this.allocationRequest(input);

    try {
      const payment = await this.transactionRunner.run(async (tx) => {
        await this.paymentRepository.lockAttention(bill.attentionId, tx);
        const totals = await this.paymentRepository.allocationTotals(bill.attentionId, tx);
        const plan = planAllocations(this.chargeLines(bill, totals), request);
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
          allocations: plan.map((allocation) => ({ id: randomUUID(), ...allocation })),
        });
        await this.paymentRepository.insert(created, tx);
        return created;
      });
      return { payment: await this.findOne(payment.id), created: true };
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

  findPage(filter: PaymentFilter, page: PageRequest): Promise<Page<Payment>> {
    return this.paymentRepository.findPage(filter, page);
  }

  async findOne(id: string, tx?: TransactionContext): Promise<Payment> {
    const payment = await this.paymentRepository.findById(id, tx);
    if (!payment) {
      throw new PaymentNotFoundError(id);
    }
    return payment;
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
    const bill = await this.requireBill(attentionId);
    const totals = await this.paymentRepository.allocationTotals(attentionId);
    const lines = sortChargeLines(this.chargeLines(bill, totals)).map((line) => {
      const allocated = this.totalsFor(totals, line.concept, line.orderItemId);
      const total =
        line.concept === AllocationConcept.DELIVERY_FEE
          ? bill.deliveryFee
          : (bill.items.find((item) => item.orderItemId === line.orderItemId)?.subtotal ?? 0);
      return {
        concept: line.concept,
        orderItemId: line.orderItemId,
        label: line.label,
        total,
        paid: allocated.counted,
        reserved: allocated.reserved,
        outstanding: line.outstanding,
      };
    });
    const sum = (pick: (line: ChargeLineBalance) => number) =>
      roundMoney(lines.reduce((acc, line) => acc + pick(line), 0));
    return {
      attentionId,
      currencyCode: bill.currencyCode,
      total: sum((line) => line.total),
      paid: sum((line) => line.paid),
      reserved: sum((line) => line.reserved),
      outstanding: sum((line) => line.outstanding),
      lines,
    };
  }

  private async requireBill(attentionId: string): Promise<AttentionBillingSnapshot> {
    const bill = await this.attentionBilling.find(attentionId);
    if (!bill) {
      throw new AttentionReferenceNotFoundError(attentionId);
    }
    return bill;
  }

  /** Billable products plus the delivery fee, minus what is already paid or in flight. */
  private chargeLines(bill: AttentionBillingSnapshot, totals: AllocationTotals[]): ChargeLine[] {
    const lines: ChargeLine[] = bill.items.map((item) => {
      const allocated = this.totalsFor(totals, AllocationConcept.ORDER_ITEM, item.orderItemId);
      return {
        concept: AllocationConcept.ORDER_ITEM,
        orderItemId: item.orderItemId,
        label: `"${item.productName}"`,
        outstanding: Math.max(0, roundMoney(item.subtotal - allocated.counted - allocated.reserved)),
        createdAt: item.createdAt,
      };
    });
    if (bill.deliveryFee > 0) {
      const allocated = this.totalsFor(totals, AllocationConcept.DELIVERY_FEE, null);
      lines.push({
        concept: AllocationConcept.DELIVERY_FEE,
        orderItemId: null,
        label: 'el costo de envío',
        outstanding: Math.max(
          0,
          roundMoney(bill.deliveryFee - allocated.counted - allocated.reserved),
        ),
        createdAt: new Date(8.64e15),
      });
    }
    return lines;
  }

  private totalsFor(
    totals: AllocationTotals[],
    concept: AllocationConcept,
    orderItemId: string | null,
  ): { counted: number; reserved: number } {
    const row = totals.find(
      (candidate) => candidate.concept === concept && candidate.orderItemId === orderItemId,
    );
    return { counted: row?.counted ?? 0, reserved: row?.reserved ?? 0 };
  }

  private allocationRequest(input: RegisterPaymentInput): AllocationRequest {
    switch (input.mode) {
      case AllocationMode.FULL:
        return { mode: AllocationMode.FULL };
      case AllocationMode.AMOUNT:
        if (input.amount === undefined) {
          throw new InvalidPaymentAmountError('El modo AMOUNT requiere el monto a pagar');
        }
        return { mode: AllocationMode.AMOUNT, amount: input.amount };
      case AllocationMode.ITEMS:
        return { mode: AllocationMode.ITEMS, allocations: input.allocations ?? [] };
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
    if (paymentId && (await this.paymentRepository.findByProviderPaymentId(code, paymentId))) {
      throw new DuplicateProviderPaymentError(code, paymentId);
    }
    const externalStatus = provider.status?.trim() || null;
    let status = PaymentStatusCode.PENDING;
    if (externalStatus) {
      const mapping = await this.mappingRepository.find(code, externalStatus);
      if (!mapping?.isActive || REFUND_STATUSES_DISABLED.includes(mapping.paymentStatus)) {
        throw new UnmappedProviderStatusError(code, externalStatus);
      }
      status = mapping.paymentStatus;
    }
    return { status, data: { code, paymentId, status: externalStatus } };
  }
}
