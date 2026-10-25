import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { CustomersAuthService } from '../../../application/auth/customers-auth.service.js';

export interface AuthenticatedCustomer {
  id: string;
  email: string;
}

/**
 * Enforces `comensal` auth (required login). Routes with `opcional` auth
 * should NOT use this guard — they resolve the token manually via
 * CustomersAuthService.verifyAccessToken so an absent/invalid token falls
 * back to guest behavior instead of a 401.
 */
@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private readonly customersAuthService: CustomersAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }
    const customer = await this.customersAuthService.verifyAccessToken(token);
    if (!customer) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    (request as Request & { customer: AuthenticatedCustomer }).customer = customer;
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
