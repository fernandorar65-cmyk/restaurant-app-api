import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Menu } from '../../domain/entities/menu.entity.js';
import { MenuNotFoundError } from '../../domain/exceptions/menu.errors.js';
import { MENU_REPOSITORY } from '../../domain/repositories/menu.repository.js';
import type { MenuRepository } from '../../domain/repositories/menu.repository.js';
import { RestaurantsService } from '../restaurants/restaurants.service.js';

export interface CreateMenuInput {
  name: string;
  description?: string;
  active?: boolean;
  restaurantId: string;
}

export interface UpdateMenuInput {
  name?: string;
  description?: string;
  active?: boolean;
  restaurantId?: string;
}

@Injectable()
export class MenusService {
  constructor(
    @Inject(MENU_REPOSITORY) private readonly menuRepository: MenuRepository,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async create(input: CreateMenuInput): Promise<Menu> {
    await this.restaurantsService.findOne(input.restaurantId);
    const menu = Menu.create({ id: randomUUID(), ...input });
    return this.menuRepository.save(menu);
  }

  findAll(): Promise<Menu[]> {
    return this.menuRepository.findAll();
  }

  async findOne(id: string): Promise<Menu> {
    const menu = await this.menuRepository.findById(id);
    if (!menu) {
      throw new MenuNotFoundError(id);
    }
    return menu;
  }

  async update(id: string, input: UpdateMenuInput): Promise<Menu> {
    const menu = await this.findOne(id);
    if (input.restaurantId) {
      await this.restaurantsService.findOne(input.restaurantId);
    }
    menu.update(input);
    return this.menuRepository.save(menu);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.menuRepository.delete(id);
    if (!deleted) {
      throw new MenuNotFoundError(id);
    }
  }
}
