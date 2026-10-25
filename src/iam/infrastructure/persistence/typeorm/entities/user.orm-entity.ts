import { Check, Column, Entity, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { inValues } from '../../../../../common/persistence/column-options.js';
import { UserStatus } from '../../../../domain/enums/user-status.enum.js';

@Entity('users')
@Unique('uq_users_email', ['email'])
@Check('chk_users_status', inValues('status', Object.values(UserStatus)))
export class UserOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 20, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ name: 'must_change_password', type: 'boolean', default: false })
  mustChangePassword: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;
}
