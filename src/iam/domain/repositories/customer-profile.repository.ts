import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { CustomerProfile } from '../entities/customer-profile.entity.js';

export const CUSTOMER_PROFILE_REPOSITORY = Symbol('CUSTOMER_PROFILE_REPOSITORY');

export interface CustomerProfileRepository {
  findByUserId(userId: string): Promise<CustomerProfile | null>;
  save(
    profile: CustomerProfile,
    tx?: TransactionContext,
  ): Promise<CustomerProfile>;
}
