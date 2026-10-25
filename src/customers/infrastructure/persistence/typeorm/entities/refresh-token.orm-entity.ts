import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { CustomerOrmEntity } from './customer.orm-entity.js';

@Entity('refresh_tokens')
export class RefreshTokenOrmEntity extends BaseOrmEntity {
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne('CustomerOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer?: CustomerOrmEntity;

  @Column({ name: 'token_hash' })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt?: Date;
}
