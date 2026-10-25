import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { inValues } from '../../../../../common/persistence/column-options.js';
import { OrderBatchSource } from '../../../../domain/enums/order-batch-source.enum.js';
import { OrderBatchStatus } from '../../../../domain/enums/order-batch-status.enum.js';
import type { UserOrmEntity } from '../../../../../iam/infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import type { AttentionParticipantOrmEntity } from './attention-participant.orm-entity.js';
import type { AttentionOrmEntity } from './attention.orm-entity.js';

// One round sent from the cart or registered by a waiter. request_id makes
// the submission idempotent within the attention.
@Entity('order_batches')
@Unique('uq_batches_attention_request', ['attentionId', 'requestId'])
@Index('idx_batches_attention_submitted', ['attentionId', 'submittedAt'])
@Check(
  'chk_batches_source',
  inValues('source', Object.values(OrderBatchSource)),
)
@Check(
  'chk_batches_status',
  inValues('status', Object.values(OrderBatchStatus)),
)
@Check(
  'chk_batches_confirmed_at',
  'confirmed_at IS NULL OR confirmed_at >= submitted_at',
)
export class OrderBatchOrmEntity extends BaseOrmEntity {
  @Column({ name: 'attention_id', type: 'uuid' })
  attentionId: string;

  @ManyToOne('AttentionOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attention_id' })
  attention?: AttentionOrmEntity;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId: string;

  @Column({ type: 'varchar', length: 20 })
  source: OrderBatchSource;

  @Column({ name: 'submitted_by_user_id', type: 'uuid', nullable: true })
  submittedByUserId: string | null;

  @ManyToOne('UserOrmEntity')
  @JoinColumn({ name: 'submitted_by_user_id' })
  submittedByUser?: UserOrmEntity;

  @Column({ name: 'submitted_by_participant_id', type: 'uuid', nullable: true })
  submittedByParticipantId: string | null;

  @ManyToOne('AttentionParticipantOrmEntity')
  @JoinColumn({ name: 'submitted_by_participant_id' })
  submittedByParticipant?: AttentionParticipantOrmEntity;

  @Column({ type: 'varchar', length: 20, default: OrderBatchStatus.SUBMITTED })
  status: OrderBatchStatus;

  @Column({
    name: 'submitted_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  submittedAt: Date;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;
}
