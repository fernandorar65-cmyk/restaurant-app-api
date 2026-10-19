import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { RolePermission } from '../../role-permissions/entities/role-permission.entity.js';

@Entity('permissions')
@Unique(['name'])
export class Permission extends BaseEntity {
  @ApiProperty({ example: 'orders:create' })
  @Column()
  name: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions?: RolePermission[];
}
