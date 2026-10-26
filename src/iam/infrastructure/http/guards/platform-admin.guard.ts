import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PLATFORM_ADMIN_ROUTE } from '../../../../common/infrastructure/http/platform-admin.decorator.js';
import type { RequestUser } from '../../../../common/infrastructure/http/current-user.decorator.js';
import { UsersService } from '../../../application/users/users.service.js';
import { PlatformAdminRequiredError } from '../../../domain/exceptions/auth.errors.js';

/**
 * Global guard that runs after AuthGuard: routes marked @PlatformAdmin()
 * also require the user to be an ACMR administrator. The flag is read from
 * the database on every call, so revoking it takes effect immediately.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const restricted = this.reflector.getAllAndOverride<boolean>(PLATFORM_ADMIN_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!restricted) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const user = request.user && (await this.usersService.findOne(request.user.id));
    if (!user?.isPlatformAdmin) {
      throw new PlatformAdminRequiredError();
    }
    return true;
  }
}
