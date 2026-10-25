import { Column, Entity, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';

@Entity('customers')
@Unique(['email'])
export class CustomerOrmEntity extends BaseOrmEntity {
  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ name: 'marketing_opt_in', default: false })
  marketingOptIn: boolean;

  @Column({ name: 'reset_password_token_hash', type: 'varchar', nullable: true })
  resetPasswordTokenHash: string | null;

  @Column({ name: 'reset_password_expires_at', type: 'timestamp', nullable: true })
  resetPasswordExpiresAt: Date | null;
}
