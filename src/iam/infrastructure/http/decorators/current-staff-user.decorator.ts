import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedStaffUser } from '../guards/staff-auth.guard.js';

/**
 * Reads the staff user attached by StaffAuthGuard. Only usable on routes
 * that apply that guard — use it together, never standalone.
 */
export const CurrentStaffUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedStaffUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { staffUser: AuthenticatedStaffUser }>();
    return request.staffUser;
  },
);
