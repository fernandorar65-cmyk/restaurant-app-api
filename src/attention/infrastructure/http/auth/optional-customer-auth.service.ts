import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { CustomersAuthService } from '../../../../customers/application/auth/customers-auth.service.js';
import { extractBearerToken } from '../../../../customers/infrastructure/http/guards/customer-auth.guard.js';

/**
 * For `opcional` auth routes (comensales.md): tries to resolve the logged-in
 * customer from the Authorization header, but never rejects the request —
 * an absent or invalid token just means "treat this as a guest".
 */
@Injectable()
export class OptionalCustomerAuthService {
  constructor(private readonly customersAuthService: CustomersAuthService) {}

  async resolve(request: Request): Promise<string | null> {
    const token = extractBearerToken(request);
    if (!token) {
      return null;
    }
    const customer = await this.customersAuthService.verifyAccessToken(token);
    return customer?.id ?? null;
  }
}
