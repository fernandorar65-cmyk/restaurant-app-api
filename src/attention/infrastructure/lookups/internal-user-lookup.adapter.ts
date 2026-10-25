import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../iam/application/users/users.service.js';
import { UserNotFoundError } from '../../../iam/domain/exceptions/user.errors.js';
import { UserLookupPort } from '../../application/ports/user-lookup.port.js';

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
