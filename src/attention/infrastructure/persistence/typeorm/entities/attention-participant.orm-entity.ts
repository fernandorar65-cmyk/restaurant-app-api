import {
  Check,
  Column,
  Entity,
  ForeignKey,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { CreatedOnlyOrmEntity } from '../../../../../common/infrastructure/persistence/base.orm-entity.js';
import type { AttentionOrmEntity } from './attention.orm-entity.js';

// A diner at the table: either a registered user or a guest identified by
// guest_token (guests are never forced to sign up).
@Entity('attention_participants')
@Unique('uq_participants_attention_user', ['attentionId', 'userId'])
@Unique('uq_participants_attention_guest', ['attentionId', 'guestToken'])
@Index('idx_participants_attention', ['attentionId'])
@Check(
  'chk_participants_identity',
  'user_id IS NOT NULL OR guest_token IS NOT NULL',
)
@Check('chk_participants_dates', 'left_at IS NULL OR left_at >= joined_at')
export class AttentionParticipantOrmEntity extends CreatedOnlyOrmEntity {
  @Column({ name: 'attention_id', type: 'uuid' })
  attentionId: string;

  @ManyToOne('AttentionOrmEntity')
  @JoinColumn({ name: 'attention_id' })
  attention?: AttentionOrmEntity;

  @ForeignKey('UserOrmEntity')
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'guest_token', type: 'uuid', nullable: true })
  guestToken: string | null;

  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  displayName: string | null;

  @Column({
    name: 'joined_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  joinedAt: Date;

  @Column({ name: 'left_at', type: 'timestamptz', nullable: true })
  leftAt: Date | null;
}
