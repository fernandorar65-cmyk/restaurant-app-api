import { Check, Column, Entity, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';

/** Separate from payment_statuses: refunds have their own cycle. */
@Entity('refund_statuses')
@Unique('uq_refund_statuses_code', ['code'])
@Check('chk_refund_statuses_code', "code ~ '^[A-Z][A-Z_]*$'")
export class RefundStatusOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 30 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'is_terminal', type: 'boolean' })
  isTerminal: boolean;

  @Column({ name: 'counts_as_refunded', type: 'boolean' })
  countsAsRefunded: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
