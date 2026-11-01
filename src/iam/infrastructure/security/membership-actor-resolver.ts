import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { ActorResolver } from '../../../common/application/ports/actor-resolver.port.js';
import { Actor, PERMISSION_CODES } from '../../../common/domain/access.js';
import { MembershipStatus } from '../../domain/enums/membership-status.enum.js';
import { OWNER_ROLE_CODE } from '../../domain/owner-role.js';

interface GrantRow {
  organization_id: string;
  all_restaurants: boolean;
  role_code: string;
  permissions: string[];
  restaurant_ids: string[];
}

/**
 * Reads, in one query, the active memberships of a user with the active
 * permissions of their (active) role and their restaurant scope. The OWNER
 * role always holds every permission, even ones added after it was created.
 */
@Injectable()
export class MembershipActorResolver implements ActorResolver {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async resolve(userId: string): Promise<Actor> {
    const [user] = await this.dataSource.query<{ is_platform_admin: boolean }[]>(
      'SELECT is_platform_admin FROM users WHERE id = $1',
      [userId],
    );
    const rows = await this.dataSource.query<GrantRow[]>(
      `SELECT m.organization_id,
              m.all_restaurants,
              r.code AS role_code,
              COALESCE(array_agg(DISTINCT p.code)
                FILTER (WHERE p.code IS NOT NULL AND p.is_active), '{}') AS permissions,
              COALESCE(array_agg(DISTINCT mr.restaurant_id::text)
                FILTER (WHERE mr.restaurant_id IS NOT NULL), '{}') AS restaurant_ids
         FROM organization_memberships m
         JOIN roles r ON r.id = m.role_id AND r.is_active
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         LEFT JOIN permissions p ON p.id = rp.permission_id
         LEFT JOIN membership_restaurants mr ON mr.membership_id = m.id
        WHERE m.user_id = $1 AND m.status = $2
        GROUP BY m.id, m.organization_id, m.all_restaurants, r.code`,
      [userId, MembershipStatus.ACTIVE],
    );
    return new Actor(
      userId,
      user?.is_platform_admin ?? false,
      rows.map((row) => ({
        organizationId: row.organization_id,
        allRestaurants: row.all_restaurants,
        restaurantIds: row.restaurant_ids,
        permissions: new Set<string>(
          row.role_code === OWNER_ROLE_CODE ? PERMISSION_CODES : row.permissions,
        ),
      })),
    );
  }
}
