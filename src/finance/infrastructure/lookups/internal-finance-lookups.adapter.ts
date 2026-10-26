import { Injectable } from '@nestjs/common';
import { AttentionReportsService } from '../../../attention/application/attention-reports/attention-reports.service.js';
import { OrganizationsService } from '../../../organizations/application/organizations/organizations.service.js';
import { RestaurantsService } from '../../../organizations/application/restaurants/restaurants.service.js';
import { OrganizationNotFoundError } from '../../../organizations/domain/exceptions/organization.errors.js';
import { RestaurantNotFoundError } from '../../../organizations/domain/exceptions/restaurant.errors.js';
import { PaymentLedgerService } from '../../../payments/application/payment-ledger/payment-ledger.service.js';
import {
  AttentionStatsPort,
  MethodSales,
  OrganizationLookupPort,
  RestaurantSnapshot,
  SalesReportPort,
} from '../../application/ports/finance-lookups.port.js';

/** In-process adapter over organizations' services. */
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

  async findRestaurant(restaurantId: string): Promise<RestaurantSnapshot | null> {
    try {
      const restaurant = await this.restaurantsService.findOne(restaurantId);
      return {
        id: restaurant.id,
        organizationId: restaurant.organizationId,
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

/** In-process adapter over the payments context's public ledger. */
@Injectable()
export class InternalSalesReportAdapter implements SalesReportPort {
  constructor(private readonly ledger: PaymentLedgerService) {}

  dailyByMethod(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<MethodSales[]> {
    return this.ledger.dailyTotals(restaurantId, businessDate, timeZone);
  }
}

/** In-process adapter over attention's public reports. */
@Injectable()
export class InternalAttentionStatsAdapter implements AttentionStatsPort {
  constructor(private readonly reports: AttentionReportsService) {}

  dailyCounts(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<{ opened: number; closed: number; cancelled: number }> {
    return this.reports.dailyCounts(restaurantId, businessDate, timeZone);
  }
}
