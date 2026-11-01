import { Injectable } from '@nestjs/common';
import { UserNotFoundError, UsersService } from '../../../iam/public-api.js';
import { UserLookupPort } from '../../application/ports/user-lookup.port.js';

/** In-process adapter over IAM's UsersService (IdentityModule). */
@Injectable()
export class InternalUserLookupAdapter implements UserLookupPort {
  constructor(private readonly usersService: UsersService) {}

  async exists(userId: string): Promise<boolean> {
    try {
      await this.usersService.findOne(userId);
      return true;
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return false;
      }
      throw error;
    }
  }
}
