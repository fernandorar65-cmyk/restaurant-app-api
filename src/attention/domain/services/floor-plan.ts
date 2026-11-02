import { Money } from '../../../common/domain/value-objects/money.js';
import { AttentionStatus } from '../enums/attention-status.enum.js';

/** How a table looks on the floor plan right now. */
export type TableOccupancy =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'BILL_REQUESTED'
  /** Inactive or in maintenance: it can't take diners. */
  | 'UNAVAILABLE';

export interface FloorPlanTable {
  id: string;
  capacity: number | null;
  isOperational: boolean;
}

export interface ActiveAttentionSummary {
  diningTableId: string | null;
  status: AttentionStatus;
  balance: number;
}

export interface FloorPlanKpis {
  /** Tables that can take diners (operational). */
  tables: number;
  availableTables: number;
  occupiedTables: number;
  /** Seats of the occupied tables (their capacity). */
  occupiedSeats: number;
  /** Active attentions, pickup and delivery included. */
  activeAttentions: number;
  billRequested: number;
  /** Still to be collected from the active attentions. */
  pendingAmount: number;
}

/**
 * Occupancy is never stored: a table is occupied while it has an active
 * attention, even if it was marked inactive in the meantime.
 */
export function tableOccupancy(
  table: FloorPlanTable,
  attention: ActiveAttentionSummary | undefined,
): TableOccupancy {
  if (attention) {
    return attention.status === AttentionStatus.BILL_REQUESTED
      ? 'BILL_REQUESTED'
      : 'OCCUPIED';
  }
  return table.isOperational ? 'AVAILABLE' : 'UNAVAILABLE';
}

export function floorPlanKpis(
  tables: FloorPlanTable[],
  attentions: ActiveAttentionSummary[],
): FloorPlanKpis {
  const byTable = new Map(
    attentions
      .filter((attention) => attention.diningTableId)
      .map((attention) => [attention.diningTableId!, attention]),
  );
  const occupied = tables.filter((table) => byTable.has(table.id));
  const operational = tables.filter((table) => table.isOperational);
  return {
    tables: operational.length,
    availableTables: operational.filter((table) => !byTable.has(table.id))
      .length,
    occupiedTables: occupied.length,
    occupiedSeats: occupied.reduce(
      (seats, table) => seats + (table.capacity ?? 0),
      0,
    ),
    activeAttentions: attentions.length,
    billRequested: attentions.filter(
      (attention) => attention.status === AttentionStatus.BILL_REQUESTED,
    ).length,
    pendingAmount: Money.sum(
      attentions.map((attention) => Money.of(Math.max(attention.balance, 0))),
    ).amount,
  };
}
