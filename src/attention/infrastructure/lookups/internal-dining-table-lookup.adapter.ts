import { Injectable } from '@nestjs/common';
import {
  DiningTableNotFoundError,
  DiningTablesService,
  RestaurantNotFoundError,
} from '../../../organizations/public-api.js';
import {
  DiningTableLookupPort,
  DiningTableSnapshot,
  FloorSnapshot,
  TableLayoutSnapshot,
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

  async findLayout(
    restaurantId: string,
  ): Promise<{
    floors: FloorSnapshot[];
    tables: TableLayoutSnapshot[];
  } | null> {
    try {
      const { floors, tables } =
        await this.diningTablesService.findLayout(restaurantId);
      return {
        floors: floors.map((floor) => ({
          id: floor.id,
          name: floor.name,
          sortOrder: floor.sortOrder,
          isActive: floor.isActive,
        })),
        tables: tables.map((table) => ({
          id: table.id,
          floorId: table.floorId,
          code: table.code,
          name: table.name,
          capacity: table.capacity,
          operationalStatus: table.operationalStatus,
          serviceStatus: table.serviceStatus,
          isOperational: table.isOperational,
          hasActiveQr: table.hasActiveQr,
          positionX: table.positionX,
          positionY: table.positionY,
        })),
      };
    } catch (error) {
      if (error instanceof RestaurantNotFoundError) {
        return null;
      }
      throw error;
    }
  }
}
