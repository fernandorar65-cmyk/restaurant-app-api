import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationsService } from '../organizations/organizations.service.js';
import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto.js';
import { Restaurant } from './entities/restaurant.entity.js';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async create(dto: CreateRestaurantDto): Promise<Restaurant> {
    await this.organizationsService.findOne(dto.organizationId);
    const restaurant = this.restaurantsRepository.create(dto);
    return this.restaurantsRepository.save(restaurant);
  }

  findAll(): Promise<Restaurant[]> {
    return this.restaurantsRepository.find();
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id },
    });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with id "${id}" not found`);
    }
    return restaurant;
  }

  async update(id: string, dto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.findOne(id);
    if (dto.organizationId) {
      await this.organizationsService.findOne(dto.organizationId);
    }
    Object.assign(restaurant, dto);
    return this.restaurantsRepository.save(restaurant);
  }

  async remove(id: string): Promise<void> {
    const result = await this.restaurantsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Restaurant with id "${id}" not found`);
    }
  }
}
