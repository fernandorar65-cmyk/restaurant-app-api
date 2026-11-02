import { describe, expect, it } from 'vitest';
import { AttentionStatus } from '../enums/attention-status.enum.js';
import { floorPlanKpis, tableOccupancy } from './floor-plan.js';

const t1 = { id: 't1', capacity: 4, isOperational: true };
const t2 = { id: 't2', capacity: 2, isOperational: true };
const t3 = { id: 't3', capacity: 6, isOperational: true };
const broken = { id: 't4', capacity: 4, isOperational: false };

describe('tableOccupancy', () => {
  it('follows the active attention of the table', () => {
    expect(tableOccupancy(t1, undefined)).toBe('AVAILABLE');
    expect(tableOccupancy(broken, undefined)).toBe('UNAVAILABLE');
    expect(
      tableOccupancy(t1, {
        diningTableId: 't1',
        status: AttentionStatus.OPEN,
        balance: 0,
      }),
    ).toBe('OCCUPIED');
    expect(
      tableOccupancy(t1, {
        diningTableId: 't1',
        status: AttentionStatus.BILL_REQUESTED,
        balance: 0,
      }),
    ).toBe('BILL_REQUESTED');
  });
});

describe('floorPlanKpis', () => {
  it('counts tables, seats and what is still to be collected', () => {
    const kpis = floorPlanKpis(
      [t1, t2, t3, broken],
      [
        { diningTableId: 't1', status: AttentionStatus.OPEN, balance: 40.1 },
        {
          diningTableId: 't3',
          status: AttentionStatus.BILL_REQUESTED,
          balance: 20.2,
        },
        // Pickup: no table, but it is still owed.
        { diningTableId: null, status: AttentionStatus.OPEN, balance: 15 },
      ],
    );
    expect(kpis).toEqual({
      tables: 3,
      availableTables: 1,
      occupiedTables: 2,
      occupiedSeats: 10,
      activeAttentions: 3,
      billRequested: 1,
      pendingAmount: 75.3,
    });
  });

  it('never counts an overpaid attention as negative debt', () => {
    expect(
      floorPlanKpis(
        [t1],
        [{ diningTableId: 't1', status: AttentionStatus.OPEN, balance: -5 }],
      ).pendingAmount,
    ).toBe(0);
  });
});
