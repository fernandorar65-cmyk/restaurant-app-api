import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { KitchenSupply } from '../../domain/entities/kitchen-supply.entity.js';
import { KitchenSupplyNotFoundError } from '../../domain/exceptions/kitchen-supply.errors.js';
import { KITCHEN_SUPPLY_REPOSITORY } from '../../domain/repositories/kitchen-supply.repository.js';
import type { KitchenSupplyRepository } from '../../domain/repositories/kitchen-supply.repository.js';
import { RestaurantsService } from '../restaurants/restaurants.service.js';

export interface CreateKitchenSupplyInput {
  name: string;
  unit: string;
  quantity?: number;
  restaurantId: string;
}

export interface UpdateKitchenSupplyInput {
  name?: string;
  unit?: string;
  quantity?: number;
  restaurantId?: string;
}

@Injectable()
export class KitchenSuppliesService {
  constructor(
    @Inject(KITCHEN_SUPPLY_REPOSITORY)
    private readonly kitchenSupplyRepository: KitchenSupplyRepository,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async create(input: CreateKitchenSupplyInput): Promise<KitchenSupply> {
    await this.restaurantsService.findOne(input.restaurantId);
    const kitchenSupply = KitchenSupply.create({ id: randomUUID(), ...input });
    return this.kitchenSupplyRepository.save(kitchenSupply);
  }

  findAll(): Promise<KitchenSupply[]> {
    return this.kitchenSupplyRepository.findAll();
  }

  async findOne(id: string): Promise<KitchenSupply> {
    const kitchenSupply = await this.kitchenSupplyRepository.findById(id);
    if (!kitchenSupply) {
      throw new KitchenSupplyNotFoundError(id);
    }
    return kitchenSupply;
  }

  async update(
    id: string,
    input: UpdateKitchenSupplyInput,
  ): Promise<KitchenSupply> {
    const kitchenSupply = await this.findOne(id);
    if (input.restaurantId) {
      await this.restaurantsService.findOne(input.restaurantId);
    }
    kitchenSupply.update(input);
    return this.kitchenSupplyRepository.save(kitchenSupply);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.kitchenSupplyRepository.delete(id);
    if (!deleted) {
      throw new KitchenSupplyNotFoundError(id);
    }
  }
}
