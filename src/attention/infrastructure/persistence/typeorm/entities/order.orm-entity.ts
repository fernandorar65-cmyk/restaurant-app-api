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
import { BaseOrmEntity } from '../../../../../common/infrastructure/persistence/base.orm-entity.js';
import { inValues } from '../../../../../common/infrastructure/persistence/column-options.js';
import { OrderSource } from '../../../../domain/enums/order-source.enum.js';
import type { AttentionParticipantOrmEntity } from './attention-participant.orm-entity.js';
import type { AttentionOrmEntity } from './attention.orm-entity.js';
import type { OrderStatusOrmEntity } from './workflow-status.orm-entity.js';

// One order sent from the cart or registered by a waiter. request_id makes
// the submission idempotent within the attention.
@Entity('orders')
@Unique('uq_orders_attention_request', ['attentionId', 'requestId'])
@Index('idx_orders_attention_submitted', ['attentionId', 'submittedAt'])
@Index('idx_orders_status', ['orderStatusId'])
@Check('chk_orders_source', inValues('source', Object.values(OrderSource)))
@Check(
  'chk_orders_confirmed_at',
  'confirmed_at IS NULL OR confirmed_at >= submitted_at',
)
export class OrderOrmEntity extends BaseOrmEntity {
  @Column({ name: 'attention_id', type: 'uuid' })
  attentionId: string;

  @ManyToOne('AttentionOrmEntity')
  @JoinColumn({ name: 'attention_id' })
  attention?: AttentionOrmEntity;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId: string;

  @Column({ type: 'varchar', length: 20 })
  source: OrderSource;

  @ForeignKey('UserOrmEntity')
  @Column({ name: 'submitted_by_user_id', type: 'uuid', nullable: true })
  submittedByUserId: string | null;

  @Column({ name: 'submitted_by_participant_id', type: 'uuid', nullable: true })
  submittedByParticipantId: string | null;

  @ManyToOne('AttentionParticipantOrmEntity')
  @JoinColumn({ name: 'submitted_by_participant_id' })
  submittedByParticipant?: AttentionParticipantOrmEntity;

  // Derived from its items; the row is the restaurant's status for that state.
  @Column({ name: 'order_status_id', type: 'uuid' })
  orderStatusId: string;

  @ManyToOne('OrderStatusOrmEntity')
  @JoinColumn({ name: 'order_status_id' })
  status?: OrderStatusOrmEntity;

  @Column({
    name: 'submitted_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  submittedAt: Date;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;
}
