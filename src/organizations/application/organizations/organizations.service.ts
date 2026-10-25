import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Organization } from '../../domain/entities/organization.entity.js';
import { OrganizationStatus } from '../../domain/enums/organization-status.enum.js';
import {
  DuplicateTaxIdentifierError,
  OrganizationNotFoundError,
} from '../../domain/exceptions/organization.errors.js';
import { ORGANIZATION_REPOSITORY } from '../../domain/repositories/organization.repository.js';
import type { OrganizationRepository } from '../../domain/repositories/organization.repository.js';

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
  ) {}

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const organization = Organization.create({ id: randomUUID(), ...input });
    await this.assertTaxIdentifierIsFree(organization);
    return this.organizationRepository.save(organization);
  }

  findAll(): Promise<Organization[]> {
    return this.organizationRepository.findAll();
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id);
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

  async remove(id: string): Promise<void> {
    const deleted = await this.organizationRepository.delete(id);
    if (!deleted) {
      throw new OrganizationNotFoundError(id);
    }
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
