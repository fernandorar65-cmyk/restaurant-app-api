import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Restaurant } from '../../domain/entities/restaurant.entity.js';
import { RestaurantNotFoundError } from '../../domain/exceptions/restaurant.errors.js';
import { RESTAURANT_REPOSITORY } from '../../domain/repositories/restaurant.repository.js';
import type { RestaurantRepository } from '../../domain/repositories/restaurant.repository.js';
import { OrganizationsService } from '../organizations/organizations.service.js';

export interface CreateRestaurantInput {
  name: string;
  slug?: string;
  address?: string;
  phone?: string;
  organizationId: string;
}

export interface UpdateRestaurantInput {
  name?: string;
  address?: string;
  phone?: string;
  organizationId?: string;
}

@Injectable()
export class RestaurantsService {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepository: RestaurantRepository,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async create(input: CreateRestaurantInput): Promise<Restaurant> {
    await this.organizationsService.findOne(input.organizationId);
    const slug = await this.uniqueSlug(input.slug ?? input.name);
    const restaurant = Restaurant.create({ id: randomUUID(), ...input, slug });
    return this.restaurantRepository.save(restaurant);
  }

  findAll(): Promise<Restaurant[]> {
    return this.restaurantRepository.findAll();
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findById(id);
    if (!restaurant) {
      throw new RestaurantNotFoundError(id);
    }
    return restaurant;
  }

  async findBySlug(slug: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findBySlug(slug);
    if (!restaurant) {
      throw new RestaurantNotFoundError(slug);
    }
    return restaurant;
  }

  async update(id: string, input: UpdateRestaurantInput): Promise<Restaurant> {
    const restaurant = await this.findOne(id);
    if (input.organizationId) {
      await this.organizationsService.findOne(input.organizationId);
    }
    restaurant.update(input);
    return this.restaurantRepository.save(restaurant);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.restaurantRepository.delete(id);
    if (!deleted) {
      throw new RestaurantNotFoundError(id);
    }
  }

  private async uniqueSlug(seed: string): Promise<string> {
    const base = slugify(seed);
    let candidate = base;
    let suffix = 1;
    while (await this.restaurantRepository.findBySlug(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
