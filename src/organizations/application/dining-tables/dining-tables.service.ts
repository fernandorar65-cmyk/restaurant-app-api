import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DiningTable } from '../../domain/entities/dining-table.entity.js';
import type { DiningTableDetails } from '../../domain/entities/dining-table.entity.js';
import { TableOperationalStatus } from '../../domain/enums/table-operational-status.enum.js';
import { TableServiceStatus } from '../../domain/enums/table-service-status.enum.js';
import {
  DiningTableNotFoundError,
  DuplicateDiningTableCodeError,
  FloorFromAnotherRestaurantError,
} from '../../domain/exceptions/dining-table.errors.js';
import { DINING_TABLE_REPOSITORY } from '../../domain/repositories/dining-table.repository.js';
import type { DiningTableRepository } from '../../domain/repositories/dining-table.repository.js';
import { RestaurantFloorsService } from '../restaurant-floors/restaurant-floors.service.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export interface CreateDiningTableInput extends DiningTableDetails {
  floorId: string;
  code: string;
  name: string;
}

export interface UpdateDiningTableInput extends DiningTableDetails {
  floorId?: string;
  operationalStatus?: TableOperationalStatus;
  serviceStatus?: TableServiceStatus;
}

@Injectable()
export class DiningTablesService {
  constructor(
    @Inject(DINING_TABLE_REPOSITORY)
    private readonly diningTableRepository: DiningTableRepository,
    private readonly floorsService: RestaurantFloorsService,
  ) {}

  /** The restaurant is taken from the floor, so they can never disagree. */
  async create(input: CreateDiningTableInput): Promise<DiningTable> {
    const floor = await this.floorsService.findOne(input.floorId);
    const diningTable = DiningTable.create({
      ...input,
      id: randomUUID(),
      restaurantId: floor.restaurantId,
    });
    await this.assertCodeIsFree(diningTable);
    return this.diningTableRepository.save(diningTable);
  }

  findPage(
    filter: { restaurantId?: string; floorId?: string },
    page: PageRequest,
  ): Promise<Page<DiningTable>> {
    return this.diningTableRepository.findPage(filter, page);
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
    if (input.floorId) {
      const floor = await this.floorsService.findOne(input.floorId);
      if (floor.restaurantId !== diningTable.restaurantId) {
        throw new FloorFromAnotherRestaurantError();
      }
    }
    diningTable.update(input);
    await this.assertCodeIsFree(diningTable);
    return this.diningTableRepository.save(diningTable);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.diningTableRepository.delete(id);
    if (!deleted) {
      throw new DiningTableNotFoundError(id);
    }
  }

  private async assertCodeIsFree(diningTable: DiningTable): Promise<void> {
    const existing = await this.diningTableRepository.findByCode(
      diningTable.restaurantId,
      diningTable.code,
    );
    if (existing && existing.id !== diningTable.id) {
      throw new DuplicateDiningTableCodeError(diningTable.code);
    }
  }
}
