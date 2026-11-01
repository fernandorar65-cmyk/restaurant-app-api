import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EVENT_BUS } from '../../../common/application/ports/event-bus.port.js';
import type { EventBus } from '../../../common/application/ports/event-bus.port.js';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Organization } from '../../domain/entities/organization.entity.js';
import { OrganizationStatus } from '../../domain/enums/organization-status.enum.js';
import { OrganizationCreated } from '../../domain/events/organization-created.event.js';
import {
  DuplicateTaxIdentifierError,
  OrganizationNotFoundError,
} from '../../domain/exceptions/organization.errors.js';
import { ORGANIZATION_REPOSITORY } from '../../domain/repositories/organization.repository.js';
import type { OrganizationRepository } from '../../domain/repositories/organization.repository.js';
import type { Page, PageRequest } from '../../../common/domain/pagination.js';

export interface CreateOrganizationInput {
  name: string;
  legalName?: string | null;
  taxIdentifier?: string | null;
  currencyCode?: string;
  timezone?: string;
}

export interface UpdateOrganizationInput extends Partial<CreateOrganizationInput> {
  status?: OrganizationStatus;
}

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
  ) {}

  /**
   * Creates the organization and announces it within the same transaction,
   * so what other contexts set up for it (IAM's base roles) is saved
   * together. `tx` lets other use cases (e.g. owner registration) include it
   * in theirs.
   */
  async create(
    input: CreateOrganizationInput,
    tx?: TransactionContext,
  ): Promise<Organization> {
    if (!tx) {
      return this.transactionRunner.run((own) => this.create(input, own));
    }
    const organization = Organization.create({ id: randomUUID(), ...input });
    await this.assertTaxIdentifierIsFree(organization);
    const saved = await this.organizationRepository.save(organization, tx);
    await this.eventBus.publish(new OrganizationCreated(saved.id), tx);
    return saved;
  }

  /** `ids` restricts the listing (e.g. to the caller's organizations). */
  findPage(
    page: PageRequest,
    filter: { ids?: string[] } = {},
  ): Promise<Page<Organization>> {
    return this.organizationRepository.findPage(page, filter);
  }

  async findOne(id: string, tx?: TransactionContext): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id, tx);
    if (!organization) {
      throw new OrganizationNotFoundError(id);
    }
    return organization;
  }

  async update(
    id: string,
    input: UpdateOrganizationInput,
  ): Promise<Organization> {
    const organization = await this.findOne(id);
    organization.update(input);
    await this.assertTaxIdentifierIsFree(organization);
    return this.organizationRepository.save(organization);
  }

  /**
   * Logical delete: operational history must be kept, so the record is
   * deactivated instead of removed.
   */
  async deactivate(id: string): Promise<void> {
    const organization = await this.findOne(id);
    organization.update({ status: OrganizationStatus.INACTIVE });
    await this.organizationRepository.save(organization);
  }

  private async assertTaxIdentifierIsFree(
    organization: Organization,
  ): Promise<void> {
    if (!organization.taxIdentifier) {
      return;
    }
    const existing = await this.organizationRepository.findByTaxIdentifier(
      organization.taxIdentifier,
    );
    if (existing && existing.id !== organization.id) {
      throw new DuplicateTaxIdentifierError(organization.taxIdentifier);
    }
  }
}
