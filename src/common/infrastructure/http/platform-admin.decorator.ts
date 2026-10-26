import { SetMetadata } from '@nestjs/common';

export const PLATFORM_ADMIN_ROUTE = 'platformAdminRoute';

/**
 * Restricts a route (or controller) to ACMR platform administrators: the
 * private API that maintains platform-wide catalogs, never a restaurant's
 * configuration. Enforced by IAM's global PlatformAdminGuard.
 */
export const PlatformAdmin = () => SetMetadata(PLATFORM_ADMIN_ROUTE, true);
