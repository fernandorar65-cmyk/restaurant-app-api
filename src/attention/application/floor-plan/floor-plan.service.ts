import { Inject, Injectable } from '@nestjs/common';
import { RestaurantReferenceNotFoundError } from '../../domain/exceptions/attention.errors.js';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';
import {
  floorPlanKpis,
  tableOccupancy,
} from '../../domain/services/floor-plan.js';
import type {
  FloorPlanKpis,
  TableOccupancy,
} from '../../domain/services/floor-plan.js';
import { AttentionQueriesService } from '../attentions/attention-queries.service.js';
import type { AttentionBill } from '../attentions/attention-queries.service.js';
import { DINING_TABLE_LOOKUP } from '../ports/dining-table-lookup.port.js';
import type {
  DiningTableLookupPort,
  FloorSnapshot,
  TableLayoutSnapshot,
} from '../ports/dining-table-lookup.port.js';

export interface FloorPlanTableView extends TableLayoutSnapshot {
  occupancy: TableOccupancy;
  /** The table's active attention with what it owes; null when free. */
  attention: AttentionBill | null;
}

export interface FloorPlan {
  restaurantId: string;
  floors: FloorSnapshot[];
  tables: FloorPlanTableView[];
  kpis: FloorPlanKpis;
}

/**
 * The room as the staff sees it: floors, tables with their occupancy and
 * active attention, and the KPIs of the moment. Polled by the floor screen,
 * so it reads only active attentions.
 */
@Injectable()
export class FloorPlanService {
  constructor(
    @Inject(DINING_TABLE_LOOKUP)
    private readonly tables: DiningTableLookupPort,
    @Inject(ATTENTION_REPOSITORY)
    private readonly attentionRepository: AttentionRepository,
    private readonly attentions: AttentionQueriesService,
  ) {}

  async getFloorPlan(restaurantId: string): Promise<FloorPlan> {
    const [layout, active] = await Promise.all([
      this.tables.findLayout(restaurantId),
      this.attentionRepository.findActiveByRestaurant(restaurantId),
    ]);
    if (!layout) {
      throw new RestaurantReferenceNotFoundError(restaurantId);
    }
    const bills = await Promise.all(
      active.map((attention) => this.attentions.billFor(attention)),
    );
    const billByTable = new Map(
      bills
        .filter((bill) => bill.attention.diningTableId)
        .map((bill) => [bill.attention.diningTableId!, bill]),
    );
    const summaries = bills.map((bill) => ({
      diningTableId: bill.attention.diningTableId,
      status: bill.attention.status,
      balance: bill.balance,
    }));
    return {
      restaurantId,
      floors: layout.floors,
      tables: layout.tables.map((table) => {
        const bill = billByTable.get(table.id);
        return {
          ...table,
          occupancy: tableOccupancy(
            table,
            summaries.find((summary) => summary.diningTableId === table.id),
          ),
          attention: bill ?? null,
        };
      }),
      kpis: floorPlanKpis(layout.tables, summaries),
    };
  }
}
