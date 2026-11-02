import { Inject, Injectable } from '@nestjs/common';
import { ACTOR_RESOLVER } from '../../../common/application/ports/actor-resolver.port.js';
import type { ActorResolver } from '../../../common/application/ports/actor-resolver.port.js';
import type { User } from '../../domain/entities/user.entity.js';
import { MembershipStatus } from '../../domain/enums/membership-status.enum.js';
import { MembershipsService } from '../memberships/memberships.service.js';
import { STAFF_DIRECTORY } from '../ports/staff-directory.port.js';
import type {
  StaffDirectoryPort,
  StaffEmployment,
} from '../ports/staff-directory.port.js';
import { RolesService } from '../roles/roles.service.js';
import { UsersService } from '../users/users.service.js';

/** What a membership lets the user do in one organization. */
export interface StaffAccess {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  role: { id: string; code: string; name: string };
  allRestaurants: boolean;
  restaurantIds: string[];
  /** Effective permissions (an OWNER always holds all of them). */
  permissions: string[];
}

export interface StaffProfile {
  user: User;
  isPlatformAdmin: boolean;
  /** Active memberships only: they are what grants access. */
  access: StaffAccess[];
  /** Employee records linked to the user, active or not. */
  employments: StaffEmployment[];
}

/**
 * Everything the staff portal needs about the logged-in user in one call:
 * personal data, what they may do in each organization and where they work.
 */
@Injectable()
export class StaffProfileService {
  constructor(
    private readonly usersService: UsersService,
    private readonly membershipsService: MembershipsService,
    private readonly rolesService: RolesService,
    @Inject(ACTOR_RESOLVER) private readonly actors: ActorResolver,
    @Inject(STAFF_DIRECTORY) private readonly directory: StaffDirectoryPort,
  ) {}

  async getProfile(userId: string): Promise<StaffProfile> {
    const [user, actor, memberships, employments] = await Promise.all([
      this.usersService.findOne(userId),
      this.actors.resolve(userId),
      // A user belongs to a handful of organizations at most.
      this.membershipsService.findPage({ userId }, { page: 1, limit: 100 }),
      this.directory.findEmployments(userId),
    ]);
    const active = memberships.items.filter(
      (membership) => membership.status === MembershipStatus.ACTIVE,
    );
    const [roles, organizationNames] = await Promise.all([
      Promise.all(
        active.map((membership) =>
          this.rolesService.findOne(membership.roleId),
        ),
      ),
      this.directory.organizationNames([
        ...new Set(active.map((membership) => membership.organizationId)),
      ]),
    ]);
    const access = active.flatMap((membership, index) => {
      const role = roles[index];
      // The actor only keeps memberships whose role is active.
      const grant = actor.grants.find(
        (candidate) => candidate.organizationId === membership.organizationId,
      );
      if (!grant) {
        return [];
      }
      return [
        {
          membershipId: membership.id,
          organizationId: membership.organizationId,
          organizationName:
            organizationNames.get(membership.organizationId) ?? '',
          role: { id: role.id, code: role.code, name: role.name },
          allRestaurants: membership.allRestaurants,
          restaurantIds: membership.restaurantIds,
          permissions: [...grant.permissions].sort(),
        },
      ];
    });
    return {
      user,
      isPlatformAdmin: actor.isPlatformAdmin,
      access,
      employments,
    };
  }
}
