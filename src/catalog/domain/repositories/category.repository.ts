import { Category } from '../entities/category.entity.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface CategoryFilter {
  organizationId?: string;
  /** null = only root categories. */
  parentCategoryId?: string | null;
  isActive?: boolean;
}

export interface CategoryRepository {
  findById(id: string): Promise<Category | null>;
  findByIds(ids: string[]): Promise<Category[]>;
  /** Same organization and parent, ignoring case. */
  findByName(
    organizationId: string,
    parentCategoryId: string | null,
    name: string,
  ): Promise<Category | null>;
  findPage(filter: CategoryFilter, page: PageRequest): Promise<Page<Category>>;
  save(category: Category): Promise<Category>;
}
