import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TRANSACTION_RUNNER } from '../common/application/ports/transaction-runner.port.js';
import { TypeOrmTransactionRunner } from '../common/infrastructure/persistence/typeorm-transaction-runner.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { OwnerRegistrationService } from './application/owner-registration/owner-registration.service.js';
import { AccessCatalogService } from './application/access-catalog/access-catalog.service.js';
import { MembershipsService } from './application/memberships/memberships.service.js';
import { PermissionsService } from './application/permissions/permissions.service.js';
import { ORGANIZATION_PROVISIONING } from './application/ports/organization-provisioning.port.js';
import { RolePermissionsService } from './application/role-permissions/role-permissions.service.js';
import { RolesService } from './application/roles/roles.service.js';
import { ORGANIZATION_MEMBERSHIP_REPOSITORY } from './domain/repositories/organization-membership.repository.js';
import { PERMISSION_REPOSITORY } from './domain/repositories/permission.repository.js';
import { ROLE_PERMISSION_REPOSITORY } from './domain/repositories/role-permission.repository.js';
import { ROLE_REPOSITORY } from './domain/repositories/role.repository.js';
import { IdentityModule } from './identity.module.js';
import { CustomerAuthController } from './infrastructure/http/controllers/customer-auth.controller.js';
import { StaffProfileService } from './application/staff-profile/staff-profile.service.js';
import { STAFF_DIRECTORY } from './application/ports/staff-directory.port.js';
import { InternalStaffDirectoryAdapter } from './infrastructure/lookups/internal-staff-directory.adapter.js';
import { IamScopeResolvers } from './infrastructure/http/iam-scope-resolvers.js';
import { OrganizationCreatedListener } from './infrastructure/events/organization-created.listener.js';
import { CustomerMeController } from './infrastructure/http/controllers/customer-me.controller.js';
import { MembershipsController } from './infrastructure/http/controllers/memberships.controller.js';
import { PermissionsController } from './infrastructure/http/controllers/permissions.controller.js';
import { RolesController } from './infrastructure/http/controllers/roles.controller.js';
import { StaffAuthController } from './infrastructure/http/controllers/staff-auth.controller.js';
import { StaffMeController } from './infrastructure/http/controllers/staff-me.controller.js';
import { UsersController } from './infrastructure/http/controllers/users.controller.js';
import { InternalOrganizationProvisioningAdapter } from './infrastructure/lookups/internal-organization-provisioning.adapter.js';
import { MembershipRestaurantOrmEntity } from './infrastructure/persistence/typeorm/entities/membership-restaurant.orm-entity.js';
import { OrganizationMembershipOrmEntity } from './infrastructure/persistence/typeorm/entities/organization-membership.orm-entity.js';
import { PermissionOrmEntity } from './infrastructure/persistence/typeorm/entities/permission.orm-entity.js';
import { RolePermissionOrmEntity } from './infrastructure/persistence/typeorm/entities/role-permission.orm-entity.js';
import { RoleOrmEntity } from './infrastructure/persistence/typeorm/entities/role.orm-entity.js';
import { TypeOrmOrganizationMembershipRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-organization-membership.repository.js';
import { TypeOrmPermissionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-permission.repository.js';
import { TypeOrmRolePermissionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-role-permission.repository.js';
import { TypeOrmRoleRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-role.repository.js';

/** Access control per organization (roles, permissions, memberships) + IAM HTTP API. */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleOrmEntity,
      PermissionOrmEntity,
      RolePermissionOrmEntity,
      OrganizationMembershipOrmEntity,
      MembershipRestaurantOrmEntity,
    ]),
    IdentityModule,
    OrganizationsModule,
  ],
  controllers: [
    StaffAuthController,
    StaffMeController,
    CustomerAuthController,
    CustomerMeController,
    UsersController,
    RolesController,
    PermissionsController,
    MembershipsController,
  ],
  providers: [
    IamScopeResolvers,
    AccessCatalogService,
    OrganizationCreatedListener,
    RolesService,
    PermissionsService,
    RolePermissionsService,
    MembershipsService,
    OwnerRegistrationService,
    StaffProfileService,
    { provide: ROLE_REPOSITORY, useClass: TypeOrmRoleRepository },
    { provide: PERMISSION_REPOSITORY, useClass: TypeOrmPermissionRepository },
    {
      provide: ROLE_PERMISSION_REPOSITORY,
      useClass: TypeOrmRolePermissionRepository,
    },
    {
      provide: ORGANIZATION_MEMBERSHIP_REPOSITORY,
      useClass: TypeOrmOrganizationMembershipRepository,
    },
    { provide: STAFF_DIRECTORY, useClass: InternalStaffDirectoryAdapter },
    {
      provide: ORGANIZATION_PROVISIONING,
      useClass: InternalOrganizationProvisioningAdapter,
    },
    { provide: TRANSACTION_RUNNER, useClass: TypeOrmTransactionRunner },
  ],
  exports: [IdentityModule],
})
export class IamModule {}
