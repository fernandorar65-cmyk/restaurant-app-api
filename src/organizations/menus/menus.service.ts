import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantsService } from '../restaurants/restaurants.service.js';
import { CreateMenuDto } from './dto/create-menu.dto.js';
import { UpdateMenuDto } from './dto/update-menu.dto.js';
import { Menu } from './entities/menu.entity.js';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private readonly menusRepository: Repository<Menu>,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async create(dto: CreateMenuDto): Promise<Menu> {
    await this.restaurantsService.findOne(dto.restaurantId);
    const menu = this.menusRepository.create(dto);
    return this.menusRepository.save(menu);
  }

  findAll(): Promise<Menu[]> {
    return this.menusRepository.find();
  }

  async findOne(id: string): Promise<Menu> {
    const menu = await this.menusRepository.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException(`Menu with id "${id}" not found`);
    }
    return menu;
  }

  async update(id: string, dto: UpdateMenuDto): Promise<Menu> {
    const menu = await this.findOne(id);
    if (dto.restaurantId) {
      await this.restaurantsService.findOne(dto.restaurantId);
    }
    Object.assign(menu, dto);
    return this.menusRepository.save(menu);
  }

  async remove(id: string): Promise<void> {
    const result = await this.menusRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Menu with id "${id}" not found`);
    }
  }
}
