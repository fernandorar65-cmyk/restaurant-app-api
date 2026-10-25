import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Category } from '../../domain/entities/category.entity.js';
import { CategoryNotFoundError } from '../../domain/exceptions/category.errors.js';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.js';
import type { CategoryRepository } from '../../domain/repositories/category.repository.js';
import { MenusService } from '../menus/menus.service.js';

export interface CreateCategoryInput {
  name: string;
  description?: string;
  menuId: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  menuId?: string;
}

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
    private readonly menusService: MenusService,
  ) {}

  async create(input: CreateCategoryInput): Promise<Category> {
    await this.menusService.findOne(input.menuId);
    const category = Category.create({ id: randomUUID(), ...input });
    return this.categoryRepository.save(category);
  }

  findAll(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new CategoryNotFoundError(id);
    }
    return category;
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const category = await this.findOne(id);
    if (input.menuId) {
      await this.menusService.findOne(input.menuId);
    }
    category.update(input);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.categoryRepository.delete(id);
    if (!deleted) {
      throw new CategoryNotFoundError(id);
    }
  }
}
