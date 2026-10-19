import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantsService } from '../restaurants/restaurants.service.js';
import { CreateDiningTableDto } from './dto/create-dining-table.dto.js';
import { UpdateDiningTableDto } from './dto/update-dining-table.dto.js';
import { DiningTable } from './entities/dining-table.entity.js';

@Injectable()
export class DiningTablesService {
  constructor(
    @InjectRepository(DiningTable)
    private readonly diningTablesRepository: Repository<DiningTable>,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async create(dto: CreateDiningTableDto): Promise<DiningTable> {
    await this.restaurantsService.findOne(dto.restaurantId);
    const diningTable = this.diningTablesRepository.create(dto);
    return this.diningTablesRepository.save(diningTable);
  }

  findAll(): Promise<DiningTable[]> {
    return this.diningTablesRepository.find();
  }

  async findOne(id: string): Promise<DiningTable> {
    const diningTable = await this.diningTablesRepository.findOne({
      where: { id },
    });
    if (!diningTable) {
      throw new NotFoundException(`Dining table with id "${id}" not found`);
    }
    return diningTable;
  }

  async update(
    id: string,
    dto: UpdateDiningTableDto,
  ): Promise<DiningTable> {
    const diningTable = await this.findOne(id);
    if (dto.restaurantId) {
      await this.restaurantsService.findOne(dto.restaurantId);
    }
    Object.assign(diningTable, dto);
    return this.diningTablesRepository.save(diningTable);
  }

  async remove(id: string): Promise<void> {
    const result = await this.diningTablesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Dining table with id "${id}" not found`);
    }
  }
}
