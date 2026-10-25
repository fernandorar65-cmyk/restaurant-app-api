import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PASSWORD_HASHER } from '../common/application/ports/password-hasher.port.js';
import { PASSWORD_RESET_NOTIFIER } from '../common/application/ports/password-reset-notifier.port.js';
import { TRANSACTION_RUNNER } from '../common/application/ports/transaction-runner.port.js';
import { ConsolePasswordResetNotifierAdapter } from '../common/infrastructure/notifications/console-password-reset-notifier.adapter.js';
import { ScryptPasswordHasher } from '../common/infrastructure/security/scrypt-password-hasher.js';
import { TypeOrmTransactionRunner } from '../common/persistence/typeorm-transaction-runner.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { AuthService } from './application/auth/auth.service.js';
import { CustomerProfilesService } from './application/customer-profiles/customer-profiles.service.js';
import { MembershipsService } from './application/memberships/memberships.service.js';
import { PermissionsService } from './application/permissions/permissions.service.js';
import { ORGANIZATION_LOOKUP } from './application/ports/organization-lookup.port.js';
import { RolePermissionsService } from './application/role-permissions/role-permissions.service.js';
import { RolesService } from './application/roles/roles.service.js';
import { UsersService } from './application/users/users.service.js';
import { CUSTOMER_PROFILE_REPOSITORY } from './domain/repositories/customer-profile.repository.js';
import { ORGANIZATION_MEMBERSHIP_REPOSITORY } from './domain/repositories/organization-membership.repository.js';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './domain/repositories/password-reset-token.repository.js';
import { PERMISSION_REPOSITORY } from './domain/repositories/permission.repository.js';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository.js';
import { ROLE_PERMISSION_REPOSITORY } from './domain/repositories/role-permission.repository.js';
import { ROLE_REPOSITORY } from './domain/repositories/role.repository.js';
import { USER_REPOSITORY } from './domain/repositories/user.repository.js';
import { CustomerAuthController } from './infrastructure/http/controllers/customer-auth.controller.js';
import { CustomerMeController } from './infrastructure/http/controllers/customer-me.controller.js';
import { MembershipsController } from './infrastructure/http/controllers/memberships.controller.js';
import { PermissionsController } from './infrastructure/http/controllers/permissions.controller.js';
import { RolesController } from './infrastructure/http/controllers/roles.controller.js';
import { StaffAuthController } from './infrastructure/http/controllers/staff-auth.controller.js';
import { StaffMeController } from './infrastructure/http/controllers/staff-me.controller.js';
import { UsersController } from './infrastructure/http/controllers/users.controller.js';
import { AuthGuard } from './infrastructure/http/guards/auth.guard.js';
import { InternalOrganizationLookupAdapter } from './infrastructure/lookups/internal-organization-lookup.adapter.js';
import { CustomerProfileOrmEntity } from './infrastructure/persistence/typeorm/entities/customer-profile.orm-entity.js';
import { MembershipRestaurantOrmEntity } from './infrastructure/persistence/typeorm/entities/membership-restaurant.orm-entity.js';
import { OrganizationMembershipOrmEntity } from './infrastructure/persistence/typeorm/entities/organization-membership.orm-entity.js';
import { PasswordResetTokenOrmEntity } from './infrastructure/persistence/typeorm/entities/password-reset-token.orm-entity.js';
import { PermissionOrmEntity } from './infrastructure/persistence/typeorm/entities/permission.orm-entity.js';
import { RefreshTokenOrmEntity } from './infrastructure/persistence/typeorm/entities/refresh-token.orm-entity.js';
import { RolePermissionOrmEntity } from './infrastructure/persistence/typeorm/entities/role-permission.orm-entity.js';
import { RoleOrmEntity } from './infrastructure/persistence/typeorm/entities/role.orm-entity.js';
import { UserOrmEntity } from './infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import { TypeOrmCustomerProfileRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-customer-profile.repository.js';
import { TypeOrmOrganizationMembershipRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-organization-membership.repository.js';
import { TypeOrmPasswordResetTokenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-password-reset-token.repository.js';
import { TypeOrmPermissionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-permission.repository.js';
import { TypeOrmRefreshTokenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-refresh-token.repository.js';
import { TypeOrmRolePermissionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-role-permission.repository.js';
import { TypeOrmRoleRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-role.repository.js';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-user.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      CustomerProfileOrmEntity,
      RoleOrmEntity,
      PermissionOrmEntity,
      RolePermissionOrmEntity,
      OrganizationMembershipOrmEntity,
      MembershipRestaurantOrmEntity,
      RefreshTokenOrmEntity,
      PasswordResetTokenOrmEntity,
    ]),
    JwtModule.register({}),
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
    AuthService,
    UsersService,
    CustomerProfilesService,
    RolesService,
    PermissionsService,
    RolePermissionsService,
    MembershipsService,
    AuthGuard,
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    {
      provide: CUSTOMER_PROFILE_REPOSITORY,
      useClass: TypeOrmCustomerProfileRepository,
    },
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
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: TypeOrmRefreshTokenRepository,
    },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: TypeOrmPasswordResetTokenRepository,
    },
    { provide: ORGANIZATION_LOOKUP, useClass: InternalOrganizationLookupAdapter },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
    {
      provide: PASSWORD_RESET_NOTIFIER,
      useClass: ConsolePasswordResetNotifierAdapter,
    },
    { provide: TRANSACTION_RUNNER, useClass: TypeOrmTransactionRunner },
  ],
  exports: [AuthService, UsersService, AuthGuard],
})
export class IamModule {}
