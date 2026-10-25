import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  DiningTable,
  DiningTableStatus,
} from '../../domain/entities/dining-table.entity.js';
import { DiningTableNotFoundError } from '../../domain/exceptions/dining-table.errors.js';
import { DINING_TABLE_REPOSITORY } from '../../domain/repositories/dining-table.repository.js';
import type { DiningTableRepository } from '../../domain/repositories/dining-table.repository.js';
import { RestaurantsService } from '../restaurants/restaurants.service.js';

export interface CreateDiningTableInput {
  tableNumber: string;
  capacity: number;
  status?: DiningTableStatus;
  restaurantId: string;
}

export interface UpdateDiningTableInput {
  tableNumber?: string;
  capacity?: number;
  status?: DiningTableStatus;
  restaurantId?: string;
}

@Injectable()
export class DiningTablesService {
  constructor(
    @Inject(DINING_TABLE_REPOSITORY)
    private readonly diningTableRepository: DiningTableRepository,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async create(input: CreateDiningTableInput): Promise<DiningTable> {
    await this.restaurantsService.findOne(input.restaurantId);
    const diningTable = DiningTable.create({ id: randomUUID(), ...input });
    return this.diningTableRepository.save(diningTable);
  }

  findAll(): Promise<DiningTable[]> {
    return this.diningTableRepository.findAll();
  }

  async findOne(id: string): Promise<DiningTable> {
    const diningTable = await this.diningTableRepository.findById(id);
    if (!diningTable) {
      throw new DiningTableNotFoundError(id);
    }
    return diningTable;
  }

  async update(
    id: string,
    input: UpdateDiningTableInput,
  ): Promise<DiningTable> {
    const diningTable = await this.findOne(id);
    if (input.restaurantId) {
      await this.restaurantsService.findOne(input.restaurantId);
    }
    diningTable.update(input);
    return this.diningTableRepository.save(diningTable);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.diningTableRepository.delete(id);
    if (!deleted) {
      throw new DiningTableNotFoundError(id);
    }
  }
}
