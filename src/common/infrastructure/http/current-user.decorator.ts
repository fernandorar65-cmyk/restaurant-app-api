import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** User attached to the request by the global auth guard. */
export interface RequestUser {
  id: string;
  email: string;
}

/**
 * Reads the authenticated user. Lives in common so any context can know who
 * is acting without importing IAM's infrastructure. Undefined on @Public()
 * routes.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: RequestUser }>();
    return request.user;
  },
);
