import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PASSWORD_HASHER } from '../common/application/ports/password-hasher.port.js';
import { PASSWORD_RESET_NOTIFIER } from '../common/application/ports/password-reset-notifier.port.js';
import { ConsolePasswordResetNotifierAdapter } from '../common/infrastructure/notifications/console-password-reset-notifier.adapter.js';
import { ScryptPasswordHasher } from '../common/infrastructure/security/scrypt-password-hasher.js';
import { StaffAuthService } from './application/auth/staff-auth.service.js';
import { PermissionsService } from './application/permissions/permissions.service.js';
import { RolePermissionsService } from './application/role-permissions/role-permissions.service.js';
import { RolesService } from './application/roles/roles.service.js';
import { UsersService } from './application/users/users.service.js';
import { PERMISSION_REPOSITORY } from './domain/repositories/permission.repository.js';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository.js';
import { ROLE_PERMISSION_REPOSITORY } from './domain/repositories/role-permission.repository.js';
import { ROLE_REPOSITORY } from './domain/repositories/role.repository.js';
import { USER_REPOSITORY } from './domain/repositories/user.repository.js';
import { PermissionOrmEntity } from './infrastructure/persistence/typeorm/entities/permission.orm-entity.js';
import { RefreshTokenOrmEntity } from './infrastructure/persistence/typeorm/entities/refresh-token.orm-entity.js';
import { RolePermissionOrmEntity } from './infrastructure/persistence/typeorm/entities/role-permission.orm-entity.js';
import { RoleOrmEntity } from './infrastructure/persistence/typeorm/entities/role.orm-entity.js';
import { UserOrmEntity } from './infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import { TypeOrmPermissionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-permission.repository.js';
import { TypeOrmRefreshTokenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-refresh-token.repository.js';
import { TypeOrmRolePermissionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-role-permission.repository.js';
import { TypeOrmRoleRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-role.repository.js';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-user.repository.js';
import { StaffAuthGuard } from './infrastructure/http/guards/staff-auth.guard.js';
import { PermissionsController } from './infrastructure/http/controllers/permissions.controller.js';
import { RolePermissionsController } from './infrastructure/http/controllers/role-permissions.controller.js';
import { RolesController } from './infrastructure/http/controllers/roles.controller.js';
import { StaffAuthController } from './infrastructure/http/controllers/staff-auth.controller.js';
import { StaffMeController } from './infrastructure/http/controllers/staff-me.controller.js';
import { UsersController } from './infrastructure/http/controllers/users.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      RoleOrmEntity,
      PermissionOrmEntity,
      RolePermissionOrmEntity,
      RefreshTokenOrmEntity,
    ]),
    JwtModule.register({}),
  ],
  controllers: [
    UsersController,
    RolesController,
    PermissionsController,
    RolePermissionsController,
    StaffAuthController,
    StaffMeController,
  ],
  providers: [
    UsersService,
    RolesService,
    PermissionsService,
    RolePermissionsService,
    StaffAuthService,
    StaffAuthGuard,
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: ROLE_REPOSITORY, useClass: TypeOrmRoleRepository },
    { provide: PERMISSION_REPOSITORY, useClass: TypeOrmPermissionRepository },
    {
      provide: ROLE_PERMISSION_REPOSITORY,
      useClass: TypeOrmRolePermissionRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: TypeOrmRefreshTokenRepository,
    },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
    {
      provide: PASSWORD_RESET_NOTIFIER,
      useClass: ConsolePasswordResetNotifierAdapter,
    },
  ],
  exports: [UsersService],
})
export class IamModule {}
