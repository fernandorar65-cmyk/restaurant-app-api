import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { ServiceType } from '../entities/service-type.entity.js';

export const SERVICE_TYPE_REPOSITORY = Symbol('SERVICE_TYPE_REPOSITORY');

export interface ServiceTypeRepository {
  findById(id: string, tx?: TransactionContext): Promise<ServiceType | null>;
  /** Active and inactive types, by sort_order. */
  findByRestaurant(
    restaurantId: string,
    tx?: TransactionContext,
  ): Promise<ServiceType[]>;
  /** Throws DuplicateServiceTypeCodeError when the code is taken. */
  save(serviceType: ServiceType, tx?: TransactionContext): Promise<ServiceType>;
  /** Inserts the default types that are missing by code (idempotent). */
  seedDefaults(
    restaurantId: string,
    defaults: ServiceType[],
    tx?: TransactionContext,
  ): Promise<void>;
}
