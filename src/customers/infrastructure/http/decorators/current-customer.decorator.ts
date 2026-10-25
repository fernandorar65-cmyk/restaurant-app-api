import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedCustomer } from '../guards/customer-auth.guard.js';

/**
 * Reads the customer attached by CustomerAuthGuard. Only usable on routes
 * that apply that guard — use it together, never standalone.
 */
export const CurrentCustomer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedCustomer => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { customer: AuthenticatedCustomer }>();
    return request.customer;
  },
);
