import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { inValues } from '../../../../../common/persistence/column-options.js';
import { ProviderEventResult } from '../../../../domain/enums/provider-event-result.enum.js';
import type { PaymentOrmEntity } from './payment.orm-entity.js';

// Audit of gateway notifications. (provider_code, event_id) is unique, so a
// repeated webhook is stored and processed only once. Card data is redacted
// before the payload is saved.
@Entity('payment_provider_events')
@Unique('uq_payment_provider_events_event', ['providerCode', 'eventId'])
@Index('idx_payment_provider_events_payment', ['paymentId'])
@Index('idx_payment_provider_events_received', ['providerCode', 'receivedAt'])
@Check('chk_payment_provider_events_result', inValues('result', Object.values(ProviderEventResult), { nullable: true }))
export class PaymentProviderEventOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'provider_code', type: 'varchar', length: 50 })
  providerCode: string;

  @Column({ name: 'event_id', type: 'varchar', length: 255 })
  eventId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string;

  @Column({ name: 'provider_payment_id', type: 'varchar', length: 255, nullable: true })
  providerPaymentId: string | null;

  @Column({ name: 'external_status', type: 'varchar', length: 100, nullable: true })
  externalStatus: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  payload: Record<string, unknown>;

  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId: string | null;

  @ManyToOne('PaymentOrmEntity', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payment_id' })
  payment?: PaymentOrmEntity;

  @Column({ name: 'received_at', type: 'timestamptz' })
  receivedAt: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  result: ProviderEventResult | null;

  @Column({ name: 'result_message', type: 'varchar', length: 500, nullable: true })
  resultMessage: string | null;
}
