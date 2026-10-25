import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { UserOrmEntity } from './user.orm-entity.js';

// Auth support table (not part of the 38-table business model): one row per
// issued refresh token, rotated on every use.
@Entity('refresh_tokens')
@Index('idx_refresh_tokens_user', ['userId'])
export class RefreshTokenOrmEntity extends BaseOrmEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne('UserOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserOrmEntity;

  @Column({ name: 'token_hash', type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;
}
