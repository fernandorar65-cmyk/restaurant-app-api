import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { OrganizationsService } from '../../../organizations/application/organizations/organizations.service.js';
import { RestaurantsService } from '../../../organizations/application/restaurants/restaurants.service.js';
import {
  NewOrganization,
  NewRestaurant,
  OrganizationProvisioningPort,
} from '../../application/ports/organization-provisioning.port.js';

/** In-process adapter: both contexts share the database, so they share the transaction. */
@Injectable()
export class InternalOrganizationProvisioningAdapter
  implements OrganizationProvisioningPort
{
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async createOrganization(
    input: NewOrganization,
    tx: TransactionContext,
  ): Promise<{ id: string; name: string }> {
    const organization = await this.organizationsService.create(input, tx);
    return { id: organization.id, name: organization.name };
  }

  async createRestaurant(
    organizationId: string,
    input: NewRestaurant,
    tx: TransactionContext,
  ): Promise<{ id: string; name: string; slug: string }> {
    const restaurant = await this.restaurantsService.create(
      { ...input, organizationId },
      tx,
    );
    return { id: restaurant.id, name: restaurant.name, slug: restaurant.slug };
  }
}
