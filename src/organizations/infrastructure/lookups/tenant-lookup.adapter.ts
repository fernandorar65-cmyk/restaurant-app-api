import { Injectable } from '@nestjs/common';
import type {
  TenantLookup,
  TenantRestaurant,
} from '../../../common/application/ports/tenant-lookup.port.js';
import { OrganizationsService } from '../../application/organizations/organizations.service.js';
import { RestaurantsService } from '../../application/restaurants/restaurants.service.js';
import type { Restaurant } from '../../domain/entities/restaurant.entity.js';
import { OrganizationNotFoundError } from '../../domain/exceptions/organization.errors.js';
import { RestaurantNotFoundError } from '../../domain/exceptions/restaurant.errors.js';

/** The one implementation of TenantLookup, used by every other context. */
@Injectable()
export class TenantLookupAdapter implements TenantLookup {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async organizationExists(organizationId: string): Promise<boolean> {
    try {
      await this.organizationsService.findOne(organizationId);
      return true;
    } catch (error) {
      if (error instanceof OrganizationNotFoundError) {
        return false;
      }
      throw error;
    }
  }

  findRestaurant(restaurantId: string): Promise<TenantRestaurant | null> {
    return this.resolve(() => this.restaurantsService.findOne(restaurantId));
  }

  findRestaurantBySlug(slug: string): Promise<TenantRestaurant | null> {
    return this.resolve(() => this.restaurantsService.findBySlug(slug));
  }

  private async resolve(
    find: () => Promise<Restaurant>,
  ): Promise<TenantRestaurant | null> {
    try {
      const restaurant = await find();
      return {
        id: restaurant.id,
        organizationId: restaurant.organizationId,
        slug: restaurant.slug,
        isActive: restaurant.isActive,
        currencyCode: restaurant.currencyCode,
        timeZone: restaurant.timezone,
      };
    } catch (error) {
      if (error instanceof RestaurantNotFoundError) {
        return null;
      }
      throw error;
    }
  }
}
