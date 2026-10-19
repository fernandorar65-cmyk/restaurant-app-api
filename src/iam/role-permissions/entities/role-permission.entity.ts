import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { Permission } from '../../permissions/entities/permission.entity.js';
import type { Role } from '../../roles/entities/role.entity.js';

@Entity('role_permissions')
@Unique(['roleId', 'permissionId'])
export class RolePermission extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'role_id' })
  roleId: string;

  @ApiProperty()
  @Column({ name: 'permission_id' })
  permissionId: string;

  @ManyToOne('Role', (role: Role) => role.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role?: Role;

  @ManyToOne('Permission', (permission: Permission) => permission.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission?: Permission;
}
