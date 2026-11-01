import {
  ForbiddenDomainError,
  ValidationDomainError,
} from './domain-error.js';

/**
 * Areas of a restaurant organization. Each one has a `.read` permission
 * (required only where data is sensitive: payments, finance, staff) and a
 * `.manage` permission (required for every change).
 */
export const ACCESS_AREAS = [
  'organizations',
  'restaurants',
  'staff',
  'settings',
  'catalog',
  'attentions',
  'kitchen',
  'payments',
  'inventory',
  'finance',
] as const;

export type AccessArea = (typeof ACCESS_AREAS)[number];
export type PermissionCode = `${AccessArea}.${'read' | 'manage'}`;

export const PERMISSION_CODES: PermissionCode[] = ACCESS_AREAS.flatMap(
  (area) => [`${area}.read`, `${area}.manage`] as PermissionCode[],
);

/** The organization (and optionally the restaurant) a request acts on. */
export interface TenantScope {
  organizationId: string;
  restaurantId?: string | null;
}

/** What one membership lets its user do. */
export interface AccessGrant {
  organizationId: string;
  /** False: only `restaurantIds`. */
  allRestaurants: boolean;
  restaurantIds: readonly string[];
  permissions: ReadonlySet<string>;
}

/**
 * Who is acting and what their active memberships allow. Platform
 * administrators (ACMR) can do anything.
 */
export class Actor {
  constructor(
    readonly userId: string,
    readonly isPlatformAdmin: boolean,
    readonly grants: readonly AccessGrant[],
  ) {}

  get organizationIds(): string[] {
    return [...new Set(this.grants.map((grant) => grant.organizationId))];
  }

  /** Belongs to the organization and, when given, may work at the restaurant. */
  canAccess(scope: TenantScope): boolean {
    return this.isPlatformAdmin || this.grantsFor(scope).length > 0;
  }

  /** `permission` null means membership is enough (non-sensitive reads). */
  can(permission: PermissionCode | null, scope: TenantScope): boolean {
    if (this.isPlatformAdmin) {
      return true;
    }
    const grants = this.grantsFor(scope);
    return permission === null
      ? grants.length > 0
      : grants.some((grant) => grant.permissions.has(permission));
  }

  private grantsFor(scope: TenantScope): AccessGrant[] {
    return this.grants.filter(
      (grant) =>
        grant.organizationId === scope.organizationId &&
        (!scope.restaurantId ||
          grant.allRestaurants ||
          grant.restaurantIds.includes(scope.restaurantId)),
    );
  }
}

export class AccessDeniedError extends ForbiddenDomainError {
  constructor(permission: PermissionCode | null) {
    super(
      permission
        ? `No tienes el permiso "${permission}" en esta organización o sede`
        : 'No perteneces a esta organización o sede',
    );
  }
}

export class TenantScopeRequiredError extends ValidationDomainError {
  constructor(fields: string[]) {
    super(`Indica ${fields.join(' u ')} para acotar la consulta`);
  }
}

export class MissingAccessPolicyError extends ForbiddenDomainError {
  constructor() {
    super('Esta ruta no declara quién puede usarla');
  }
}
