import { Injectable } from '@nestjs/common';
import { DiningTablesService } from '../../../organizations/application/dining-tables/dining-tables.service.js';
import {
  TableQrLookupPort,
  TableQrResolution,
} from '../../application/ports/table-qr-lookup.port.js';

/** In-process adapter: the QR lives on the dining table (organizations). */
@Injectable()
export class InternalTableQrLookupAdapter implements TableQrLookupPort {
  constructor(private readonly diningTablesService: DiningTablesService) {}

  async resolveByToken(token: string): Promise<TableQrResolution | null> {
    const resolved = await this.diningTablesService.resolveQrToken(token);
    if (!resolved) {
      return null;
    }
    return {
      restaurantId: resolved.restaurant.id,
      restaurantSlug: resolved.restaurant.slug,
      restaurantName: resolved.restaurant.name,
      tableId: resolved.table.id,
      tableCode: resolved.table.code,
      tableName: resolved.table.name,
    };
  }
}
