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
 * resolve the token through AuthService.verifyAccessToken instead.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }
    const user = await this.authService.verifyAccessToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    (request as Request & { user: AuthenticatedUser }).user = user;
    return true;
  }
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  return header.slice('Bearer '.length).trim() || null;
}
