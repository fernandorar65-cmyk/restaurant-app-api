import { Injectable } from '@nestjs/common';
import { DiningTablesService } from '../../../organizations/application/dining-tables/dining-tables.service.js';
import { DiningTableNotFoundError } from '../../../organizations/domain/exceptions/dining-table.errors.js';
import {
  DiningTableLookupPort,
  DiningTableSnapshot,
} from '../../application/ports/dining-table-lookup.port.js';

/** In-process adapter over organizations' DiningTablesService. */
@Injectable()
export class InternalDiningTableLookupAdapter implements DiningTableLookupPort {
  constructor(private readonly diningTablesService: DiningTablesService) {}

  async findById(diningTableId: string): Promise<DiningTableSnapshot | null> {
    try {
      const table = await this.diningTablesService.findOne(diningTableId);
      return {
        id: table.id,
        restaurantId: table.restaurantId,
        isOperational: table.isOperational,
      };
    } catch (error) {
      if (error instanceof DiningTableNotFoundError) {
        return null;
      }
      throw error;
    }
  }
}
