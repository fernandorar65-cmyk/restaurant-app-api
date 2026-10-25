import { Injectable } from '@nestjs/common';
import { TableQrCodesService } from '../../../organizations/application/table-qr-codes/table-qr-codes.service.js';
import {
  TableQrLookupPort,
  TableQrResolution,
} from '../../application/ports/table-qr-lookup.port.js';

/** In-process adapter over organizations' TableQrCodesService. */
@Injectable()
export class InternalTableQrLookupAdapter implements TableQrLookupPort {
  constructor(private readonly qrCodesService: TableQrCodesService) {}

  async resolveByToken(token: string): Promise<TableQrResolution | null> {
    const resolved = await this.qrCodesService.resolveToken(token);
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
