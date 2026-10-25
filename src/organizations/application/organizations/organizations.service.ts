import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Organization } from '../../domain/entities/organization.entity.js';
import {
  DuplicateOrganizationNameError,
  OrganizationNotFoundError,
} from '../../domain/exceptions/organization.errors.js';
import { ORGANIZATION_REPOSITORY } from '../../domain/repositories/organization.repository.js';
import type { OrganizationRepository } from '../../domain/repositories/organization.repository.js';

export interface CreateOrganizationInput {
  name: string;
  email?: string;
  phone?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  email?: string;
  phone?: string;
}

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const existing = await this.organizationRepository.findByName(input.name);
    if (existing) {
      throw new DuplicateOrganizationNameError(input.name);
    }
    const organization = Organization.create({ id: randomUUID(), ...input });
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
    return this.organizationRepository.save(organization);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.organizationRepository.delete(id);
    if (!deleted) {
      throw new OrganizationNotFoundError(id);
    }
  }
}
