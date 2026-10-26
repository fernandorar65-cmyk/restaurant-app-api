import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { PaymentStatus } from '../entities/payment-status.entity.js';
import { ProviderEvent } from '../entities/provider-event.entity.js';
import { ProviderStatusMapping } from '../entities/provider-status-mapping.entity.js';
import type { PaymentStatusCode } from '../enums/payment-status-code.enum.js';
import type {
  PaymentStatusDefinition,
  RefundStatusDefinition,
} from '../status-catalog.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';

export const PAYMENT_STATUS_REPOSITORY = Symbol('PAYMENT_STATUS_REPOSITORY');
export const PROVIDER_STATUS_MAPPING_REPOSITORY = Symbol('PROVIDER_STATUS_MAPPING_REPOSITORY');
export const PROVIDER_EVENT_REPOSITORY = Symbol('PROVIDER_EVENT_REPOSITORY');

export interface PaymentStatusRepository {
  findAll(): Promise<PaymentStatus[]>;
  findByCode(code: PaymentStatusCode): Promise<PaymentStatus | null>;
  save(status: PaymentStatus): Promise<PaymentStatus>;
  /**
   * Inserts missing codes and re-applies the accounting flags of existing
   * ones (names and descriptions edited by ACMR are kept).
   */
  ensureCatalog(
    payments: PaymentStatusDefinition[],
    refunds: RefundStatusDefinition[],
  ): Promise<void>;
}

export interface ProviderStatusMappingRepository {
  findById(id: string): Promise<ProviderStatusMapping | null>;
  /** Exact provider + external status, ignoring case. */
  find(providerCode: string, externalStatus: string): Promise<ProviderStatusMapping | null>;
  findPage(
    filter: { providerCode?: string; isActive?: boolean },
    page: PageRequest,
  ): Promise<Page<ProviderStatusMapping>>;
  save(mapping: ProviderStatusMapping): Promise<ProviderStatusMapping>;
}

export interface ProviderEventRepository {
  findByEventId(providerCode: string, eventId: string): Promise<ProviderEvent | null>;
  /** False when the same provider event was already stored. */
  insertIfNew(event: ProviderEvent, tx: TransactionContext): Promise<boolean>;
  save(event: ProviderEvent, tx?: TransactionContext): Promise<void>;
  findPage(filter: { providerCode?: string }, page: PageRequest): Promise<Page<ProviderEvent>>;
}
