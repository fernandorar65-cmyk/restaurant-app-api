import { Injectable } from '@nestjs/common';
import type { TenantScope } from '../../../domain/access.js';

/**
 * Finds the tenant of a resource; null when it doesn't exist. Returning only
 * the restaurant is enough: the guard looks up its organization.
 */
export type ScopeResolver = (
  id: string,
) => Promise<TenantScope | { restaurantId: string } | null>;

/**
 * Each context registers how to find the organization/restaurant of the
 * resources its routes receive by id (e.g. 'product' -> its restaurant), so
 * the authorization guard never imports another context.
 */
@Injectable()
export class ScopeResolverRegistry {
  private readonly resolvers = new Map<string, ScopeResolver>();

  register(resource: string, resolver: ScopeResolver): void {
    if (this.resolvers.has(resource)) {
      throw new Error(`Scope resolver "${resource}" registered twice`);
    }
    this.resolvers.set(resource, resolver);
  }

  resolve(
    resource: string,
    id: string,
  ): Promise<TenantScope | { restaurantId: string } | null> {
    const resolver = this.resolvers.get(resource);
    if (!resolver) {
      throw new Error(`No scope resolver registered for "${resource}"`);
    }
    return resolver(id);
  }

  has(resource: string): boolean {
    return this.resolvers.has(resource);
  }
}
