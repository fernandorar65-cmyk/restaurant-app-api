import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { RoleOrmEntity } from './role.orm-entity.js';

@Entity('users')
@Unique(['email'])
export class UserOrmEntity extends BaseOrmEntity {
  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'role_id' })
  roleId: string;

  @Column({ name: 'reset_password_token_hash', type: 'varchar', nullable: true })
  resetPasswordTokenHash: string | null;

  @Column({ name: 'reset_password_expires_at', type: 'timestamp', nullable: true })
  resetPasswordExpiresAt: Date | null;

  @ManyToOne('RoleOrmEntity', (role: RoleOrmEntity) => role.users, {
    eager: true,
  })
  @JoinColumn({ name: 'role_id' })
  role?: RoleOrmEntity;
}
