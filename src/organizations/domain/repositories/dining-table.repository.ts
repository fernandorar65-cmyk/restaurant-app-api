import { DiningTable } from '../entities/dining-table.entity.js';

export const DINING_TABLE_REPOSITORY = Symbol('DINING_TABLE_REPOSITORY');

export interface DiningTableRepository {
  findById(id: string): Promise<DiningTable | null>;
  findAll(): Promise<DiningTable[]>;
  save(diningTable: DiningTable): Promise<DiningTable>;
  delete(id: string): Promise<boolean>;
}
