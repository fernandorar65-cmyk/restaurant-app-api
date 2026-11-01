import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PASSWORD_HASHER } from '../../../common/application/ports/password-hasher.port.js';
import type { PasswordHasher } from '../../../common/application/ports/password-hasher.port.js';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { CustomerProfile } from '../../domain/entities/customer-profile.entity.js';
import { User } from '../../domain/entities/user.entity.js';
import { DuplicateEmailError } from '../../domain/exceptions/user.errors.js';
import { CUSTOMER_PROFILE_REPOSITORY } from '../../domain/repositories/customer-profile.repository.js';
import type { CustomerProfileRepository } from '../../domain/repositories/customer-profile.repository.js';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import { AuthService, type AuthTokens } from './auth.service.js';

export interface RegisterCustomerInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  dietaryPreferences?: string | null;
}

/** Diner sign-up: the user, its diner profile and a first session. */
@Injectable()
export class CustomerRegistrationService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly customerProfileRepository: CustomerProfileRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    private readonly authService: AuthService,
  ) {}

  /** Creates the user and its diner profile together. */
  async registerCustomer(
    input: RegisterCustomerInput,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new DuplicateEmailError(existing.email);
    }
    const draft = User.create({
      id: randomUUID(),
      email: input.email,
      passwordHash: await this.passwordHasher.hash(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    });
    const user = await this.transactionRunner.run(async (tx) => {
      const saved = await this.userRepository.save(draft, tx);
      await this.customerProfileRepository.save(
        CustomerProfile.create({
          userId: saved.id,
          dietaryPreferences: input.dietaryPreferences,
        }),
        tx,
      );
      return saved;
    });
    return { user, tokens: await this.authService.startSession(user) };
  }
}
