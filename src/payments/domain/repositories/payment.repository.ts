import type { Page, PageRequest } from '../../../common/application/pagination.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Payment } from '../entities/payment.entity.js';
import type { AllocationConcept } from '../enums/allocation-concept.enum.js';
import type { PaymentStatusCode } from '../enums/payment-status-code.enum.js';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

/** Allocated amounts of one charge line of an attention. */
export interface AllocationTotals {
  concept: AllocationConcept;
  orderItemId: string | null;
  /** Payments whose status counts toward the balance. */
  counted: number;
  /** Payments still in flight (not terminal, not counted yet). */
  reserved: number;
}

export interface PaymentFilter {
  attentionId?: string;
  restaurantId?: string;
  status?: PaymentStatusCode;
}

export interface PaymentRepository {
  findById(id: string, tx?: TransactionContext): Promise<Payment | null>;
  /** Locks the payment row until the transaction ends. */
  findByIdForUpdate(id: string, tx: TransactionContext): Promise<Payment | null>;
  findByRequestId(restaurantId: string, requestId: string): Promise<Payment | null>;
  findByProviderPaymentId(
    providerCode: string,
    providerPaymentId: string,
    tx?: TransactionContext,
  ): Promise<Payment | null>;
  findPage(filter: PaymentFilter, page: PageRequest): Promise<Page<Payment>>;
  /** Payment and its allocations. Throws DuplicatePaymentRequestError on a repeated requestId. */
  insert(payment: Payment, tx: TransactionContext): Promise<void>;
  /** Persists status, paid date and provider status (amount and allocations never change). */
  updateStatus(payment: Payment, tx?: TransactionContext): Promise<void>;
  /**
   * Serializes payments of the same attention for the rest of the
   * transaction, so concurrent payments can't exceed what is owed.
   */
  lockAttention(attentionId: string, tx: TransactionContext): Promise<void>;
  allocationTotals(attentionId: string, tx?: TransactionContext): Promise<AllocationTotals[]>;
}
