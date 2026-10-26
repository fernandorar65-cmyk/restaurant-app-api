import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PASSWORD_HASHER } from '../common/application/ports/password-hasher.port.js';
import { PASSWORD_RESET_NOTIFIER } from '../common/application/ports/password-reset-notifier.port.js';
import { TRANSACTION_RUNNER } from '../common/application/ports/transaction-runner.port.js';
import { ConsolePasswordResetNotifierAdapter } from '../common/infrastructure/notifications/console-password-reset-notifier.adapter.js';
import { ScryptPasswordHasher } from '../common/infrastructure/security/scrypt-password-hasher.js';
import { TypeOrmTransactionRunner } from '../common/persistence/typeorm-transaction-runner.js';
import { AuthService } from './application/auth/auth.service.js';
import { CustomerProfilesService } from './application/customer-profiles/customer-profiles.service.js';
import { UsersService } from './application/users/users.service.js';
import { CUSTOMER_PROFILE_REPOSITORY } from './domain/repositories/customer-profile.repository.js';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './domain/repositories/password-reset-token.repository.js';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository.js';
import { USER_REPOSITORY } from './domain/repositories/user.repository.js';
import { AuthGuard } from './infrastructure/http/guards/auth.guard.js';
import { PlatformAdminGuard } from './infrastructure/http/guards/platform-admin.guard.js';
import { CustomerProfileOrmEntity } from './infrastructure/persistence/typeorm/entities/customer-profile.orm-entity.js';
import { PasswordResetTokenOrmEntity } from './infrastructure/persistence/typeorm/entities/password-reset-token.orm-entity.js';
import { RefreshTokenOrmEntity } from './infrastructure/persistence/typeorm/entities/refresh-token.orm-entity.js';
import { UserOrmEntity } from './infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import { TypeOrmCustomerProfileRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-customer-profile.repository.js';
import { TypeOrmPasswordResetTokenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-password-reset-token.repository.js';
import { TypeOrmRefreshTokenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-refresh-token.repository.js';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-user.repository.js';

/**
 * Users and authentication: the part of IAM that does not depend on
 * organizations. Split out so organizations can use it (employees link to
 * users) while the rest of IAM (roles, memberships) depends on organizations,
 * without a module cycle.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      CustomerProfileOrmEntity,
      RefreshTokenOrmEntity,
      PasswordResetTokenOrmEntity,
    ]),
    JwtModule.register({}),
  ],
  providers: [
    AuthService,
    UsersService,
    CustomerProfilesService,
    AuthGuard,
    // Session required everywhere unless the route is marked @Public().
    { provide: APP_GUARD, useExisting: AuthGuard },
    // Then @PlatformAdmin() routes also require an ACMR administrator.
    { provide: APP_GUARD, useClass: PlatformAdminGuard },
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    {
      provide: CUSTOMER_PROFILE_REPOSITORY,
      useClass: TypeOrmCustomerProfileRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: TypeOrmRefreshTokenRepository,
    },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: TypeOrmPasswordResetTokenRepository,
    },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
    {
      provide: PASSWORD_RESET_NOTIFIER,
      useClass: ConsolePasswordResetNotifierAdapter,
    },
    { provide: TRANSACTION_RUNNER, useClass: TypeOrmTransactionRunner },
  ],
  exports: [
    AuthService,
    UsersService,
    CustomerProfilesService,
    AuthGuard,
    USER_REPOSITORY,
    PASSWORD_HASHER,
  ],
})
export class IdentityModule {}
