import { Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../../common/persistence/base.orm-entity.js';
import type { DiningTableOrmEntity } from './dining-table.orm-entity.js';

@Entity('table_qr_codes')
@Unique(['diningTableId'])
export class TableQrCodeOrmEntity extends BaseOrmEntity {
  @Column({ name: 'code_url' })
  codeUrl: string;

  @Column({ name: 'dining_table_id' })
  diningTableId: string;

  @OneToOne('DiningTableOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dining_table_id' })
  diningTable?: DiningTableOrmEntity;
}
