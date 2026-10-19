import { Module } from '@nestjs/common';
import { PermissionsModule } from './permissions/permissions.module.js';
import { RolePermissionsModule } from './role-permissions/role-permissions.module.js';
import { RolesModule } from './roles/roles.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [UsersModule, RolesModule, PermissionsModule, RolePermissionsModule],
})
export class IamModule {}
