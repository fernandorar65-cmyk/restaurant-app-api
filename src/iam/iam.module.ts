import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port.js';
import { PermissionsService } from './application/permissions/permissions.service.js';
import { RolePermissionsService } from './application/role-permissions/role-permissions.service.js';
import { RolesService } from './application/roles/roles.service.js';
import { UsersService } from './application/users/users.service.js';
import { PERMISSION_REPOSITORY } from './domain/repositories/permission.repository.js';
import { ROLE_PERMISSION_REPOSITORY } from './domain/repositories/role-permission.repository.js';
import { ROLE_REPOSITORY } from './domain/repositories/role.repository.js';
import { USER_REPOSITORY } from './domain/repositories/user.repository.js';
import { PermissionOrmEntity } from './infrastructure/persistence/typeorm/entities/permission.orm-entity.js';
import { RolePermissionOrmEntity } from './infrastructure/persistence/typeorm/entities/role-permission.orm-entity.js';
import { RoleOrmEntity } from './infrastructure/persistence/typeorm/entities/role.orm-entity.js';
import { UserOrmEntity } from './infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import { TypeOrmPermissionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-permission.repository.js';
import { TypeOrmRolePermissionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-role-permission.repository.js';
import { TypeOrmRoleRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-role.repository.js';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-user.repository.js';
import { ScryptPasswordHasher } from './infrastructure/security/scrypt-password-hasher.js';
import { PermissionsController } from './infrastructure/http/controllers/permissions.controller.js';
import { RolePermissionsController } from './infrastructure/http/controllers/role-permissions.controller.js';
import { RolesController } from './infrastructure/http/controllers/roles.controller.js';
import { UsersController } from './infrastructure/http/controllers/users.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      RoleOrmEntity,
      PermissionOrmEntity,
      RolePermissionOrmEntity,
    ]),
  ],
  controllers: [
    UsersController,
    RolesController,
    PermissionsController,
    RolePermissionsController,
  ],
  providers: [
    UsersService,
    RolesService,
    PermissionsService,
    RolePermissionsService,
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: ROLE_REPOSITORY, useClass: TypeOrmRoleRepository },
    { provide: PERMISSION_REPOSITORY, useClass: TypeOrmPermissionRepository },
    {
      provide: ROLE_PERMISSION_REPOSITORY,
      useClass: TypeOrmRolePermissionRepository,
    },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
  ],
})
export class IamModule {}
