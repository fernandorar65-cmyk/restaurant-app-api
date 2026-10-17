import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto.js';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto.js';
import { MenuItem } from './entities/menu-item.entity.js';

@Injectable()
export class MenuItemsService {
  private readonly items: MenuItem[] = [];

  create(dto: CreateMenuItemDto): MenuItem {
    const item: MenuItem = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
      price: dto.price,
      available: dto.available ?? true,
    };
    this.items.push(item);
    return item;
  }

  findAll(): MenuItem[] {
    return this.items;
  }

  findOne(id: string): MenuItem {
    const item = this.items.find((menuItem) => menuItem.id === id);
    if (!item) {
      throw new NotFoundException(`Menu item with id "${id}" not found`);
    }
    return item;
  }

  update(id: string, dto: UpdateMenuItemDto): MenuItem {
    const item = this.findOne(id);
    Object.assign(item, dto);
    return item;
  }

  remove(id: string): void {
    const index = this.items.findIndex((menuItem) => menuItem.id === id);
    if (index === -1) {
      throw new NotFoundException(`Menu item with id "${id}" not found`);
    }
    this.items.splice(index, 1);
  }
}
