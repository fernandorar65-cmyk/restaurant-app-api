import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Restaurant } from '../../domain/entities/restaurant.entity.js';
import type { RestaurantDetails } from '../../domain/entities/restaurant.entity.js';
import { RestaurantStatus } from '../../domain/enums/restaurant-status.enum.js';
import {
  DuplicateRestaurantCodeError,
  RestaurantNotFoundError,
} from '../../domain/exceptions/restaurant.errors.js';
import { RESTAURANT_REPOSITORY } from '../../domain/repositories/restaurant.repository.js';
import type { RestaurantRepository } from '../../domain/repositories/restaurant.repository.js';
import { OrganizationsService } from '../organizations/organizations.service.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export interface CreateRestaurantInput extends RestaurantDetails {
  organizationId: string;
  name: string;
  code?: string;
  slug?: string;
}

export interface UpdateRestaurantInput extends RestaurantDetails {
  status?: RestaurantStatus;
}

@Injectable()
export class RestaurantsService {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepository: RestaurantRepository,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async create(input: CreateRestaurantInput): Promise<Restaurant> {
    const organization = await this.organizationsService.findOne(
      input.organizationId,
    );
    const slug = await this.uniqueSlug(input.slug ?? input.name);
    const code = input.code ?? slug.toUpperCase().slice(0, 50);
    const existing = await this.restaurantRepository.findByCode(
      organization.id,
      code,
    );
    if (existing) {
      throw new DuplicateRestaurantCodeError(code);
    }
    const restaurant = Restaurant.create({
      ...input,
      id: randomUUID(),
      code,
      slug,
      // A restaurant inherits its organization's settings unless overridden.
      currencyCode: input.currencyCode ?? organization.currencyCode,
      timezone: input.timezone ?? organization.timezone,
    });
    return this.restaurantRepository.save(restaurant);
  }

  findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<Restaurant>> {
    return this.restaurantRepository.findPage(filter, page);
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
