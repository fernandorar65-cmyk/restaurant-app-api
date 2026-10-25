import { Injectable } from '@nestjs/common';
import { OrganizationsService } from '../../../organizations/application/organizations/organizations.service.js';
import { RestaurantsService } from '../../../organizations/application/restaurants/restaurants.service.js';
import { OrganizationNotFoundError } from '../../../organizations/domain/exceptions/organization.errors.js';
import { RestaurantNotFoundError } from '../../../organizations/domain/exceptions/restaurant.errors.js';
import { OrganizationLookupPort } from '../../application/ports/organization-lookup.port.js';

/** In-process adapter over organizations' application services. */
@Injectable()
export class InternalOrganizationLookupAdapter implements OrganizationLookupPort {
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

  async findRestaurantOrganizationId(restaurantId: string): Promise<string | null> {
    try {
      return (await this.restaurantsService.findOne(restaurantId)).organizationId;
    } catch (error) {
      if (error instanceof RestaurantNotFoundError) {
        return null;
      }
      throw error;
    }
  }
}
