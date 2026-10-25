import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { StaffAuthService } from '../../../application/auth/staff-auth.service.js';

export interface AuthenticatedStaffUser {
  id: string;
  email: string;
}

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly staffAuthService: StaffAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }
    const user = await this.staffAuthService.verifyAccessToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    (request as Request & { staffUser: AuthenticatedStaffUser }).staffUser = user;
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
