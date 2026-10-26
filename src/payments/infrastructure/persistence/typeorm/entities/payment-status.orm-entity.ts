import { Check, Column, Entity, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';

/** Platform-wide catalog maintained by ACMR (not per restaurant). */
@Entity('payment_statuses')
@Unique('uq_payment_statuses_code', ['code'])
@Check('chk_payment_statuses_code', "code ~ '^[A-Z][A-Z_]*$'")
export class PaymentStatusOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 30 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'is_terminal', type: 'boolean' })
  isTerminal: boolean;

  @Column({ name: 'counts_toward_balance', type: 'boolean' })
  countsTowardBalance: boolean;

  @Column({ name: 'allows_refund', type: 'boolean' })
  allowsRefund: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
