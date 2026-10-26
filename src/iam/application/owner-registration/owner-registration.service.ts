import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PASSWORD_HASHER } from '../../../common/application/ports/password-hasher.port.js';
import type { PasswordHasher } from '../../../common/application/ports/password-hasher.port.js';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { OrganizationMembership } from '../../domain/entities/organization-membership.entity.js';
import { RolePermission } from '../../domain/entities/role-permission.entity.js';
import { Role } from '../../domain/entities/role.entity.js';
import { User } from '../../domain/entities/user.entity.js';
import { DuplicateEmailError } from '../../domain/exceptions/user.errors.js';
import { OWNER_ROLE_CODE } from '../../domain/owner-role.js';
import { ORGANIZATION_MEMBERSHIP_REPOSITORY } from '../../domain/repositories/organization-membership.repository.js';
import type { OrganizationMembershipRepository } from '../../domain/repositories/organization-membership.repository.js';
import { PERMISSION_REPOSITORY } from '../../domain/repositories/permission.repository.js';
import type { PermissionRepository } from '../../domain/repositories/permission.repository.js';
import { ROLE_PERMISSION_REPOSITORY } from '../../domain/repositories/role-permission.repository.js';
import type { RolePermissionRepository } from '../../domain/repositories/role-permission.repository.js';
import { ROLE_REPOSITORY } from '../../domain/repositories/role.repository.js';
import type { RoleRepository } from '../../domain/repositories/role.repository.js';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import { AuthService } from '../auth/auth.service.js';
import type { AuthTokens } from '../auth/auth.service.js';
import { ORGANIZATION_PROVISIONING } from '../ports/organization-provisioning.port.js';
import type {
  NewOrganization,
  NewRestaurant,
  OrganizationProvisioningPort,
} from '../ports/organization-provisioning.port.js';

export interface RegisterOwnerInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  organization: NewOrganization;
  /** First restaurant, when onboarding already asks for it. */
  restaurant?: NewRestaurant;
}

export interface OwnerRegistration {
  user: User;
  tokens: AuthTokens;
  organization: { id: string; name: string };
  restaurant: { id: string; name: string; slug: string } | null;
  roleId: string;
  membershipId: string;
  permissionCount: number;
}

/**
 * Owner sign-up: user + organization + OWNER role (with every active
 * permission) + membership over all restaurants (+ first restaurant), all in
 * one transaction. If any step fails nothing is kept: there is never an
 * owner without organization, role or membership.
 */
@Injectable()
export class OwnerRegistrationService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
    @Inject(ROLE_PERMISSION_REPOSITORY)
    private readonly rolePermissionRepository: RolePermissionRepository,
    @Inject(ORGANIZATION_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: OrganizationMembershipRepository,
    @Inject(ORGANIZATION_PROVISIONING)
    private readonly provisioning: OrganizationProvisioningPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    private readonly authService: AuthService,
  ) {}

  async register(input: RegisterOwnerInput): Promise<OwnerRegistration> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new DuplicateEmailError(existing.email);
    }
    const draftUser = User.create({
      id: randomUUID(),
      email: input.email,
      passwordHash: await this.passwordHasher.hash(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    });
    const permissions = await this.permissionRepository.findActive();

    const result = await this.transactionRunner.run(async (tx) => {
      const user = await this.userRepository.save(draftUser, tx);
      const organization = await this.provisioning.createOrganization(
        input.organization,
        tx,
      );
      const role = await this.roleRepository.save(
        Role.create({
          id: randomUUID(),
          organizationId: organization.id,
          code: OWNER_ROLE_CODE,
          name: 'Propietario',
          description: 'Acceso total a la organización',
          isSystem: true,
        }),
        tx,
      );
      for (const permission of permissions) {
        await this.rolePermissionRepository.save(
          RolePermission.create({ roleId: role.id, permissionId: permission.id }),
          tx,
        );
      }
      const membership = await this.membershipRepository.save(
        OrganizationMembership.create({
          id: randomUUID(),
          organizationId: organization.id,
          userId: user.id,
          roleId: role.id,
          allRestaurants: true,
        }),
        tx,
      );
      const restaurant = input.restaurant
        ? await this.provisioning.createRestaurant(organization.id, input.restaurant, tx)
        : null;
      return { user, organization, restaurant, role, membership };
    });

    return {
      user: result.user,
      tokens: await this.authService.startSession(result.user),
      organization: result.organization,
      restaurant: result.restaurant,
      roleId: result.role.id,
      membershipId: result.membership.id,
      permissionCount: permissions.length,
    };
  }
}
