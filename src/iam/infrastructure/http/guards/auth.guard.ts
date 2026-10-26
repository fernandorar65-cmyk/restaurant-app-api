import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_ROUTE } from '../../../../common/infrastructure/http/public.decorator.js';
import { AuthService } from '../../../application/auth/auth.service.js';
import type { AuthenticatedUser } from '../../../application/auth/auth.service.js';

export type { AuthenticatedUser };

/**
 * Global guard: every route requires a valid access token, except the ones
 * marked @Public(). Diner routes are public and resolve the (optional) user
 * themselves through AuthService.authenticateBearer.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        message: 'Falta el token de acceso',
        errorCode: 'MISSING_ACCESS_TOKEN',
      });
    }
    const user = await this.authService.authenticateBearer(header);
    if (!user) {
      throw new UnauthorizedException({
        message: 'Token de acceso inválido o vencido',
        errorCode: 'INVALID_ACCESS_TOKEN',
      });
    }
    (request as Request & { user: AuthenticatedUser }).user = user;
    return true;
  }
}

