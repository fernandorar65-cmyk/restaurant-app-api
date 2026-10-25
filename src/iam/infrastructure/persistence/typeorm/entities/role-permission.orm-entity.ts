import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { PermissionOrmEntity } from './permission.orm-entity.js';
import type { RoleOrmEntity } from './role.orm-entity.js';

@Entity('role_permissions')
export class RolePermissionOrmEntity {
  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @PrimaryColumn({ name: 'permission_id', type: 'uuid' })
  permissionId: string;

  @ManyToOne('RoleOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role?: RoleOrmEntity;

  @ManyToOne('PermissionOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission?: PermissionOrmEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
