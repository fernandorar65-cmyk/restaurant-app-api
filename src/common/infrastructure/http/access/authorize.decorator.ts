import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { ApiAccess } from '../openapi.js';
import type { Request } from 'express';
import type { Actor, PermissionCode } from '../../../domain/access.js';

export const ACCESS_POLICY = 'accessPolicy';

type RequestPart = 'body' | 'query' | 'params';

/** Where a request says which organization or restaurant it acts on. */
export type ScopeSource =
  | { kind: 'organization' | 'restaurant'; from: RequestPart; field: string }
  /** A resource id whose tenant is looked up (see ScopeResolverRegistry). */
  | { kind: 'resource'; resource: string; from: RequestPart; field: string };

export type AccessPolicy =
  | { type: 'authenticated' }
  | {
      type: 'tenant';
      permission: PermissionCode | null;
      scopes: ScopeSource[];
    };

export const Scope = {
  organization: (from: RequestPart, field = 'organizationId'): ScopeSource => ({
    kind: 'organization',
    from,
    field,
  }),
  restaurant: (from: RequestPart, field = 'restaurantId'): ScopeSource => ({
    kind: 'restaurant',
    from,
    field,
  }),
  /** By default the `:id` path parameter. */
  resource: (
    resource: string,
    field = 'id',
    from: RequestPart = 'params',
  ): ScopeSource => ({ kind: 'resource', resource, from, field }),
};

/**
 * Who may call a staff route: members of the target organization/restaurant
 * holding `permission` (null: membership is enough). The scopes are tried in
 * order; the first one present in the request decides the tenant, and a
 * request carrying none of them is rejected.
 */
export const Authorize = (
  permission: PermissionCode | null,
  ...scopes: [ScopeSource, ...ScopeSource[]]
) =>
  applyDecorators(
    SetMetadata(ACCESS_POLICY, {
      type: 'tenant',
      permission,
      scopes,
    } satisfies AccessPolicy),
    ApiAccess({ type: 'tenant', permission }),
  );

/** Any logged-in user, no tenant involved (e.g. their own profile). */
export const Authenticated = () =>
  applyDecorators(
    SetMetadata(ACCESS_POLICY, {
      type: 'authenticated',
    } satisfies AccessPolicy),
    ApiAccess({ type: 'session' }),
  );

/** The Actor the authorization guard resolved for this request. */
export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Actor =>
    ctx.switchToHttp().getRequest<Request & { actor: Actor }>().actor,
);
