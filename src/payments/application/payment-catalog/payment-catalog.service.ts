import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { PaymentStatus } from '../../domain/entities/payment-status.entity.js';
import {
  normalizeProviderCode,
  ProviderStatusMapping,
} from '../../domain/entities/provider-status-mapping.entity.js';
import type { PaymentStatusCode } from '../../domain/enums/payment-status-code.enum.js';
import {
  DuplicateProviderStatusMappingError,
  PaymentStatusNotFoundError,
  ProviderStatusMappingNotFoundError,
} from '../../domain/exceptions/payment.errors.js';
import {
  PAYMENT_STATUS_REPOSITORY,
  PROVIDER_STATUS_MAPPING_REPOSITORY,
} from '../../domain/repositories/payment-catalog.repository.js';
import type {
  PaymentStatusRepository,
  ProviderStatusMappingRepository,
} from '../../domain/repositories/payment-catalog.repository.js';
import { PAYMENT_STATUSES, REFUND_STATUSES } from '../../domain/status-catalog.js';

/**
 * Private ACMR maintenance of the payment status catalog and of the
 * translation of each gateway's statuses. Never part of a restaurant's
 * configuration.
 */
@Injectable()
export class PaymentCatalogService implements OnApplicationBootstrap {
  constructor(
    @Inject(PAYMENT_STATUS_REPOSITORY)
    private readonly statusRepository: PaymentStatusRepository,
    @Inject(PROVIDER_STATUS_MAPPING_REPOSITORY)
    private readonly mappingRepository: ProviderStatusMappingRepository,
  ) {}

  /** The internal statuses must exist before any payment is registered. */
  async onApplicationBootstrap(): Promise<void> {
    await this.statusRepository.ensureCatalog(PAYMENT_STATUSES, REFUND_STATUSES);
  }

  listStatuses(): Promise<PaymentStatus[]> {
    return this.statusRepository.findAll();
  }

  /** Only the visible name and description; code and accounting effect are fixed. */
  async renameStatus(
    code: PaymentStatusCode,
    input: { name?: string; description?: string | null },
  ): Promise<PaymentStatus> {
    const status = await this.statusRepository.findByCode(code);
    if (!status) {
      throw new PaymentStatusNotFoundError(code);
    }
    status.rename(input);
    return this.statusRepository.save(status);
  }

  findMappings(
    filter: { providerCode?: string; isActive?: boolean },
    page: PageRequest,
  ): Promise<Page<ProviderStatusMapping>> {
    return this.mappingRepository.findPage(
      {
        ...filter,
        providerCode: filter.providerCode && normalizeProviderCode(filter.providerCode),
      },
      page,
    );
  }

  async createMapping(input: {
    providerCode: string;
    externalStatus: string;
    paymentStatus: PaymentStatusCode;
  }): Promise<ProviderStatusMapping> {
    const mapping = ProviderStatusMapping.create({ id: randomUUID(), ...input });
    if (await this.mappingRepository.find(mapping.providerCode, mapping.externalStatus)) {
      throw new DuplicateProviderStatusMappingError(mapping.providerCode, mapping.externalStatus);
    }
    return this.mappingRepository.save(mapping);
  }

  /** Activates / deactivates or retargets a mapping; affects future notifications only. */
  async updateMapping(
    id: string,
    input: { paymentStatus?: PaymentStatusCode; isActive?: boolean },
  ): Promise<ProviderStatusMapping> {
    const mapping = await this.mappingRepository.findById(id);
    if (!mapping) {
      throw new ProviderStatusMappingNotFoundError(id);
    }
    mapping.update(input);
    return this.mappingRepository.save(mapping);
  }
}
