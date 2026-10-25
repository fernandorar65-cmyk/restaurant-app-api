import { Injectable } from '@nestjs/common';
import { DiningTablesService } from '../../../organizations/application/dining-tables/dining-tables.service.js';
import { RestaurantsService } from '../../../organizations/application/restaurants/restaurants.service.js';
import { TableQrCodesService } from '../../../organizations/application/table-qr-codes/table-qr-codes.service.js';
import { TableQrCodeNotFoundError } from '../../../organizations/domain/exceptions/table-qr-code.errors.js';
import {
  TableQrLookupPort,
  TableQrResolution,
} from '../../application/ports/table-qr-lookup.port.js';

@Injectable()
export class InternalTableQrLookupAdapter implements TableQrLookupPort {
  constructor(
    private readonly tableQrCodesService: TableQrCodesService,
    private readonly diningTablesService: DiningTablesService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async resolveByToken(token: string): Promise<TableQrResolution | null> {
    let qrCode;
    try {
      qrCode = await this.tableQrCodesService.findOne(token);
    } catch (error) {
      if (error instanceof TableQrCodeNotFoundError) {
        return null;
      }
      throw error;
    }

    const table = await this.diningTablesService.findOne(qrCode.diningTableId);
    const restaurant = await this.restaurantsService.findOne(table.restaurantId);

    return {
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      restaurantName: restaurant.name,
      tableId: table.id,
      tableNumber: table.tableNumber,
      tableStatus: table.status,
    };
  }
}
