import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { UserOrmEntity } from './user.orm-entity.js';

@Entity('staff_refresh_tokens')
export class RefreshTokenOrmEntity extends BaseOrmEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne('UserOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserOrmEntity;

  @Column({ name: 'token_hash' })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt?: Date;
}
