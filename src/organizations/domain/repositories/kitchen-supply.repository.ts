import { KitchenSupply } from '../entities/kitchen-supply.entity.js';

export const KITCHEN_SUPPLY_REPOSITORY = Symbol('KITCHEN_SUPPLY_REPOSITORY');

export interface KitchenSupplyRepository {
  findById(id: string): Promise<KitchenSupply | null>;
  findAll(): Promise<KitchenSupply[]>;
  save(kitchenSupply: KitchenSupply): Promise<KitchenSupply>;
  delete(id: string): Promise<boolean>;
}
