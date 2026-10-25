import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RestaurantFloor } from '../../domain/entities/restaurant-floor.entity.js';
import {
  DuplicateRestaurantFloorNameError,
  RestaurantFloorNotFoundError,
} from '../../domain/exceptions/restaurant-floor.errors.js';
import { RESTAURANT_FLOOR_REPOSITORY } from '../../domain/repositories/restaurant-floor.repository.js';
import type { RestaurantFloorRepository } from '../../domain/repositories/restaurant-floor.repository.js';
import { RestaurantsService } from '../restaurants/restaurants.service.js';

export interface CreateRestaurantFloorInput {
  restaurantId: string;
  name: string;
  sortOrder?: number;
}

export interface UpdateRestaurantFloorInput {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class RestaurantFloorsService {
  constructor(
    @Inject(RESTAURANT_FLOOR_REPOSITORY)
    private readonly floorRepository: RestaurantFloorRepository,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async create(input: CreateRestaurantFloorInput): Promise<RestaurantFloor> {
    await this.restaurantsService.findOne(input.restaurantId);
    const floor = RestaurantFloor.create({ id: randomUUID(), ...input });
    await this.assertNameIsFree(floor);
    return this.floorRepository.save(floor);
  }

  findAll(filter: { restaurantId?: string } = {}): Promise<RestaurantFloor[]> {
    return this.floorRepository.findAll(filter);
  }

  async findOne(id: string): Promise<RestaurantFloor> {
    const floor = await this.floorRepository.findById(id);
    if (!floor) {
      throw new RestaurantFloorNotFoundError(id);
    }
    return floor;
  }

  async update(
    id: string,
    input: UpdateRestaurantFloorInput,
  ): Promise<RestaurantFloor> {
    const floor = await this.findOne(id);
    floor.update(input);
    await this.assertNameIsFree(floor);
    return this.floorRepository.save(floor);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.floorRepository.delete(id);
    if (!deleted) {
      throw new RestaurantFloorNotFoundError(id);
    }
  }

  private async assertNameIsFree(floor: RestaurantFloor): Promise<void> {
    const existing = await this.floorRepository.findByName(
      floor.restaurantId,
      floor.name,
    );
    if (existing && existing.id !== floor.id) {
      throw new DuplicateRestaurantFloorNameError(floor.name);
    }
  }
}
