import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CreatedOnlyOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { DiningTableOrmEntity } from './dining-table.orm-entity.js';

// Only the hash of the QR token is stored, never the token itself.
@Entity('table_qr_codes')
@Unique('uq_qr_codes_token_hash', ['tokenHash'])
@Unique('uq_qr_codes_table_version', ['diningTableId', 'version'])
@Index('idx_qr_codes_table_active', ['diningTableId', 'isActive'])
@Index('uq_qr_codes_active_per_table', ['diningTableId'], {
  unique: true,
  where: 'is_active = TRUE',
})
@Check('chk_qr_codes_version', 'version > 0')
@Check('chk_qr_codes_revocation', 'revoked_at IS NULL OR is_active = FALSE')
export class TableQrCodeOrmEntity extends CreatedOnlyOrmEntity {
  @Column({ name: 'dining_table_id', type: 'uuid' })
  diningTableId: string;

  @ManyToOne('DiningTableOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dining_table_id' })
  diningTable?: DiningTableOrmEntity;

  @Column({ name: 'token_hash', type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    name: 'generated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  generatedAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;
}
