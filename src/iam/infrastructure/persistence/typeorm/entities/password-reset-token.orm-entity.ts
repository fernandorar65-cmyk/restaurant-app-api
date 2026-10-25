import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CreatedOnlyOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { UserOrmEntity } from './user.orm-entity.js';

// Auth support table (not part of the 38-table business model).
@Entity('password_reset_tokens')
@Unique('uq_password_reset_tokens_hash', ['tokenHash'])
export class PasswordResetTokenOrmEntity extends CreatedOnlyOrmEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne('UserOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserOrmEntity;

  @Column({ name: 'token_hash', type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date | null;
}
