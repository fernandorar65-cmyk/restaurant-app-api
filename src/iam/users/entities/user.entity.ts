import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { Role } from '../../roles/entities/role.entity.js';

@Entity('users')
@Unique(['email'])
export class User extends BaseEntity {
  @ApiProperty({ example: 'Ana Pérez' })
  @Column()
  name: string;

  @ApiProperty({ example: 'ana@restaurant.com' })
  @Column()
  email: string;

  @Column({ select: false })
  password: string;

  @ApiProperty()
  @Column({ name: 'role_id' })
  roleId: string;

  @ManyToOne('Role', (role: Role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role?: Role;
}
