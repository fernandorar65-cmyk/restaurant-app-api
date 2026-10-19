import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantsService } from '../restaurants/restaurants.service.js';
import { CreateKitchenSupplyDto } from './dto/create-kitchen-supply.dto.js';
import { UpdateKitchenSupplyDto } from './dto/update-kitchen-supply.dto.js';
import { KitchenSupply } from './entities/kitchen-supply.entity.js';

@Injectable()
export class KitchenSuppliesService {
  constructor(
    @InjectRepository(KitchenSupply)
    private readonly kitchenSuppliesRepository: Repository<KitchenSupply>,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async create(dto: CreateKitchenSupplyDto): Promise<KitchenSupply> {
    await this.restaurantsService.findOne(dto.restaurantId);
    const kitchenSupply = this.kitchenSuppliesRepository.create(dto);
    return this.kitchenSuppliesRepository.save(kitchenSupply);
  }

  findAll(): Promise<KitchenSupply[]> {
    return this.kitchenSuppliesRepository.find();
  }

  async findOne(id: string): Promise<KitchenSupply> {
    const kitchenSupply = await this.kitchenSuppliesRepository.findOne({
      where: { id },
    });
    if (!kitchenSupply) {
      throw new NotFoundException(`Kitchen supply with id "${id}" not found`);
    }
    return kitchenSupply;
  }

  async update(
    id: string,
    dto: UpdateKitchenSupplyDto,
  ): Promise<KitchenSupply> {
    const kitchenSupply = await this.findOne(id);
    if (dto.restaurantId) {
      await this.restaurantsService.findOne(dto.restaurantId);
    }
    Object.assign(kitchenSupply, dto);
    return this.kitchenSuppliesRepository.save(kitchenSupply);
  }

  async remove(id: string): Promise<void> {
    const result = await this.kitchenSuppliesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Kitchen supply with id "${id}" not found`);
    }
  }
}
