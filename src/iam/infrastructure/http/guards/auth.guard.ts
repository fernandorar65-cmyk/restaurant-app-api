import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../../../application/auth/auth.service.js';
import type { AuthenticatedUser } from '../../../application/auth/auth.service.js';

export type { AuthenticatedUser };

/**
 * Requires a valid access token and attaches the user to the request. Routes
 * where login is optional (e.g. guest diners) must not use this guard; they
 * resolve the user through AuthService.authenticateBearer instead.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

