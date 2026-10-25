import { Injectable } from '@nestjs/common';
import { DiningTablesService } from '../../../organizations/application/dining-tables/dining-tables.service.js';
import { DiningTableNotFoundError } from '../../../organizations/domain/exceptions/dining-table.errors.js';
import { DiningTableLookupPort } from '../../application/ports/dining-table-lookup.port.js';

/**
 * In-process adapter: resolves the port by calling organizations'
 * application service directly, since both contexts live in the same
 * monolith today. If attention is ever split out, only this file changes
 * (e.g. to an HTTP/gRPC client) — the port and everything using it stays
 * untouched.
 */
@Injectable()
export class InternalDiningTableLookupAdapter implements DiningTableLookupPort {
  constructor(private readonly diningTablesService: DiningTablesService) {}

  async exists(diningTableId: string): Promise<boolean> {
    try {
      await this.diningTablesService.findOne(diningTableId);
      return true;
    } catch (error) {
      if (error instanceof DiningTableNotFoundError) {
        return false;
      }
      throw error;
    }
  }
}
