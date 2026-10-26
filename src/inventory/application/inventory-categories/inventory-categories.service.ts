import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InventoryCategory } from '../../domain/entities/inventory-category.entity.js';
import {
  DuplicateInventoryCategoryNameError,
  InventoryCategoryNotFoundError,
  OrganizationReferenceNotFoundError,
} from '../../domain/exceptions/inventory.errors.js';
import { INVENTORY_CATEGORY_REPOSITORY } from '../../domain/repositories/inventory-category.repository.js';
import type { InventoryCategoryRepository } from '../../domain/repositories/inventory-category.repository.js';
import { ORGANIZATION_LOOKUP } from '../ports/organization-lookup.port.js';
import type { OrganizationLookupPort } from '../ports/organization-lookup.port.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

@Injectable()
export class InventoryCategoriesService {
  constructor(
    @Inject(INVENTORY_CATEGORY_REPOSITORY)
    private readonly categoryRepository: InventoryCategoryRepository,
    @Inject(ORGANIZATION_LOOKUP)
    private readonly organizationLookup: OrganizationLookupPort,
  ) {}

  async create(input: {
    organizationId: string;
    name: string;
  }): Promise<InventoryCategory> {
    if (!(await this.organizationLookup.organizationExists(input.organizationId))) {
      throw new OrganizationReferenceNotFoundError(input.organizationId);
    }
    const category = InventoryCategory.create({ id: randomUUID(), ...input });
    await this.assertNameIsFree(category);
    return this.categoryRepository.save(category);
  }

  findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<InventoryCategory>> {
    return this.categoryRepository.findPage(filter, page);
  }

  async findOne(id: string): Promise<InventoryCategory> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new InventoryCategoryNotFoundError(id);
    }
    return category;
  }

  async update(
    id: string,
    input: { name?: string; isActive?: boolean },
  ): Promise<InventoryCategory> {
    const category = await this.findOne(id);
    category.update(input);
    await this.assertNameIsFree(category);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.categoryRepository.delete(id);
    if (!deleted) {
      throw new InventoryCategoryNotFoundError(id);
    }
  }

  private async assertNameIsFree(category: InventoryCategory): Promise<void> {
    const existing = await this.categoryRepository.findByName(
      category.organizationId,
      category.name,
    );
    if (existing && existing.id !== category.id) {
      throw new DuplicateInventoryCategoryNameError(category.name);
    }
  }
}
