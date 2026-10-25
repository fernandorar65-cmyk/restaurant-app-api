import { Inject, Injectable } from '@nestjs/common';
import { CustomerProfile } from '../../domain/entities/customer-profile.entity.js';
import { CUSTOMER_PROFILE_REPOSITORY } from '../../domain/repositories/customer-profile.repository.js';
import type { CustomerProfileRepository } from '../../domain/repositories/customer-profile.repository.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class CustomerProfilesService {
  constructor(
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profileRepository: CustomerProfileRepository,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Any user can act as a diner, so the profile is created lazily for users
   * that registered through another flow (e.g. staff).
   */
  async findOrCreate(userId: string): Promise<CustomerProfile> {
    const existing = await this.profileRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }
    await this.usersService.findOne(userId);
    return this.profileRepository.save(CustomerProfile.create({ userId }));
  }

  async update(
    userId: string,
    input: { dietaryPreferences?: string | null },
  ): Promise<CustomerProfile> {
    const profile = await this.findOrCreate(userId);
    if (input.dietaryPreferences !== undefined) {
      profile.changeDietaryPreferences(input.dietaryPreferences);
    }
    return this.profileRepository.save(profile);
  }
}
