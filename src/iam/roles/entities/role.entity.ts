import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { RolePermission } from '../../role-permissions/entities/role-permission.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('roles')
@Unique(['name'])
export class Role extends BaseEntity {
  @ApiProperty({ example: 'admin' })
  @Column()
  name: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => User, (user) => user.role)
  users?: User[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions?: RolePermission[];
}
