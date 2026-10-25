import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../../common/persistence/base.orm-entity.js';
import type { PermissionOrmEntity } from './permission.orm-entity.js';
import type { RoleOrmEntity } from './role.orm-entity.js';

@Entity('role_permissions')
@Unique(['roleId', 'permissionId'])
export class RolePermissionOrmEntity extends BaseOrmEntity {
  @Column({ name: 'role_id' })
  roleId: string;

  @Column({ name: 'permission_id' })
  permissionId: string;

  @ManyToOne('RoleOrmEntity', (role: RoleOrmEntity) => role.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role?: RoleOrmEntity;

  @ManyToOne(
    'PermissionOrmEntity',
    (permission: PermissionOrmEntity) => permission.rolePermissions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'permission_id' })
  permission?: PermissionOrmEntity;
}
