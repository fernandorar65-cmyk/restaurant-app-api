import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ACTOR_RESOLVER } from '../../../application/ports/actor-resolver.port.js';
import type { ActorResolver } from '../../../application/ports/actor-resolver.port.js';
import { TENANT_LOOKUP } from '../../../application/ports/tenant-lookup.port.js';
import type { TenantLookup } from '../../../application/ports/tenant-lookup.port.js';
import {
  AccessDeniedError,
  MissingAccessPolicyError,
  TenantScopeRequiredError,
  type Actor,
  type TenantScope,
} from '../../../domain/access.js';
import type { RequestUser } from '../current-user.decorator.js';
import { PLATFORM_ADMIN_ROUTE } from '../platform-admin.decorator.js';
import { IS_PUBLIC_ROUTE } from '../public.decorator.js';
import {
  ACCESS_POLICY,
  type AccessPolicy,
  type ScopeSource,
} from './authorize.decorator.js';
import { ScopeResolverRegistry } from './scope-resolver.registry.js';

type AccessRequest = Request & { user?: RequestUser; actor?: Actor };

/** Not found: the route itself answers 404, nothing to authorize against. */
const MISSING = Symbol('missing');

/**
 * Global guard that runs after AuthGuard (session) and PlatformAdminGuard.
 * Deny by default: a staff route must declare @Authorize or @Authenticated.
 */
@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ACTOR_RESOLVER) private readonly actors: ActorResolver,
    @Inject(TENANT_LOOKUP) private readonly tenants: TenantLookup,
    private readonly resolvers: ScopeResolverRegistry,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, targets) ||
      this.reflector.getAllAndOverride<boolean>(PLATFORM_ADMIN_ROUTE, targets)
    ) {
      return true;
    }
    const policy = this.reflector.getAllAndOverride<AccessPolicy>(
      ACCESS_POLICY,
      targets,
    );
    if (!policy) {
      throw new MissingAccessPolicyError();
    }
    const request = context.switchToHttp().getRequest<AccessRequest>();
    // AuthGuard already rejected requests without a valid session.
    const actor = await this.actors.resolve((request.user as RequestUser).id);
    request.actor = actor;
    if (policy.type === 'authenticated' || actor.isPlatformAdmin) {
      return true;
    }
    const scope = await this.scopeOf(policy.scopes, request);
    if (scope === MISSING) {
      return true;
    }
    if (!actor.can(policy.permission, scope)) {
      throw new AccessDeniedError(policy.permission);
    }
    return true;
  }

  private async scopeOf(
    sources: ScopeSource[],
    request: AccessRequest,
  ): Promise<TenantScope | typeof MISSING> {
    for (const source of sources) {
      const value = (
        request[source.from] as Record<string, unknown> | undefined
      )?.[source.field];
      if (typeof value !== 'string' || !value) {
        continue;
      }
      if (source.kind === 'organization') {
        return { organizationId: value };
      }
      const found =
        source.kind === 'resource'
          ? await this.resolveResource(source.resource, value)
          : { restaurantId: value };
      return (found && (await this.complete(found))) ?? MISSING;
    }
    throw new TenantScopeRequiredError(sources.map((source) => source.field));
  }

  /** 'organization' and 'restaurant' are built in; the rest come from the contexts. */
  private async resolveResource(
    resource: string,
    id: string,
  ): Promise<TenantScope | { restaurantId: string } | null> {
    if (resource === 'organization') {
      return (await this.tenants.organizationExists(id))
        ? { organizationId: id }
        : null;
    }
    if (resource === 'restaurant') {
      return { restaurantId: id };
    }
    return this.resolvers.resolve(resource, id);
  }

  /** Adds the organization of a restaurant-only scope; null if it doesn't exist. */
  private async complete(
    found: TenantScope | { restaurantId: string },
  ): Promise<TenantScope | null> {
    if ('organizationId' in found && found.organizationId) {
      return found;
    }
    const restaurant = await this.tenants.findRestaurant(
      found.restaurantId as string,
    );
    return restaurant
      ? {
          organizationId: restaurant.organizationId,
          restaurantId: restaurant.id,
        }
      : null;
  }
}
