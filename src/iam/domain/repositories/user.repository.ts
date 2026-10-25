import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { User } from '../entities/user.entity.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User, tx?: TransactionContext): Promise<User>;
  delete(id: string): Promise<boolean>;
}
