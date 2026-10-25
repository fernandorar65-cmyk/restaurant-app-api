import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../../common/persistence/base.orm-entity.js';
import { RolePermissionOrmEntity } from './role-permission.orm-entity.js';
import { UserOrmEntity } from './user.orm-entity.js';

@Entity('roles')
@Unique(['name'])
export class RoleOrmEntity extends BaseOrmEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany(() => UserOrmEntity, (user) => user.role)
  users?: UserOrmEntity[];

  @OneToMany(
    () => RolePermissionOrmEntity,
    (rolePermission) => rolePermission.role,
  )
  rolePermissions?: RolePermissionOrmEntity[];
}
