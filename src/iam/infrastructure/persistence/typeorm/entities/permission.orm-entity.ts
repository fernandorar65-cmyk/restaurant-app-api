import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { RolePermissionOrmEntity } from './role-permission.orm-entity.js';

@Entity('permissions')
@Unique(['name'])
export class PermissionOrmEntity extends BaseOrmEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany(
    () => RolePermissionOrmEntity,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions?: RolePermissionOrmEntity[];
}
