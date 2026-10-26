import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Category } from '../../domain/entities/category.entity.js';
import {
  CategoryCycleError,
  CategoryFromAnotherOrganizationError,
  CategoryNotFoundError,
  DuplicateCategoryNameError,
  InactiveCategoryError,
  OrganizationReferenceNotFoundError,
} from '../../domain/exceptions/catalog.errors.js';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.js';
import type {
  CategoryFilter,
  CategoryRepository,
} from '../../domain/repositories/category.repository.js';
import { RESTAURANT_LOOKUP } from '../ports/restaurant-lookup.port.js';
import type { RestaurantLookupPort } from '../ports/restaurant-lookup.port.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export interface CreateCategoryInput {
  organizationId: string;
  parentCategoryId?: string | null;
  name: string;
  description?: string | null;
}

export interface UpdateCategoryInput {
  parentCategoryId?: string | null;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

/** Product categories of an organization, organized as a tree. */
@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
    @Inject(RESTAURANT_LOOKUP)
    private readonly restaurantLookup: RestaurantLookupPort,
  ) {}

  async create(input: CreateCategoryInput): Promise<Category> {
    if (!(await this.restaurantLookup.organizationExists(input.organizationId))) {
      throw new OrganizationReferenceNotFoundError(input.organizationId);
    }
    const category = Category.create({ id: randomUUID(), ...input });
    if (category.parentCategoryId) {
      await this.assertValidParent(category, category.parentCategoryId);
    }
    await this.assertNameIsFree(category);
    return this.categoryRepository.save(category);
  }

  findPage(filter: CategoryFilter, page: PageRequest): Promise<Page<Category>> {
    return this.categoryRepository.findPage(filter, page);
  }

  findByIds(ids: string[]): Promise<Category[]> {
    return this.categoryRepository.findByIds(ids);
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new CategoryNotFoundError(id);
    }
    return category;
  }

  /** Also activates / deactivates through isActive; can move under another parent. */
  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const category = await this.findOne(id);
    if (input.parentCategoryId && input.parentCategoryId !== category.parentCategoryId) {
      await this.assertValidParent(category, input.parentCategoryId);
    }
    category.update(input);
    await this.assertNameIsFree(category);
    return this.categoryRepository.save(category);
  }

  /**
   * Never deleted: products and menu sections may point to it. A deactivated
   * category keeps its links but can't receive new ones.
   */
  async deactivate(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  /** Category a product or menu section of the given organization can use. */
  async findAssignable(organizationId: string, categoryId: string): Promise<Category> {
    const category = await this.findOne(categoryId);
    if (category.organizationId !== organizationId) {
      throw new CategoryFromAnotherOrganizationError();
    }
    if (!category.isActive) {
      throw new InactiveCategoryError();
    }
    return category;
  }

  /**
   * The parent must be an active category of the same organization and must
   * not be the category itself or one of its descendants.
   */
  private async assertValidParent(category: Category, parentId: string): Promise<void> {
    const parent = await this.findAssignable(category.organizationId, parentId);
    let ancestorId: string | null = parent.id;
    while (ancestorId) {
      if (ancestorId === category.id) {
        throw new CategoryCycleError();
      }
      const ancestor = await this.categoryRepository.findById(ancestorId);
      ancestorId = ancestor?.parentCategoryId ?? null;
    }
  }

  private async assertNameIsFree(category: Category): Promise<void> {
    const existing = await this.categoryRepository.findByName(
      category.organizationId,
      category.parentCategoryId,
      category.name,
    );
    if (existing && existing.id !== category.id) {
      throw new DuplicateCategoryNameError(category.name);
    }
  }
}
