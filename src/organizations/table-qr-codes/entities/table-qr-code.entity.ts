import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { DiningTable } from '../../dining-tables/entities/dining-table.entity.js';

@Entity('table_qr_codes')
@Unique(['diningTableId'])
export class TableQrCode extends BaseEntity {
  @ApiProperty({ example: 'https://app.restaurant.com/t/424590bf' })
  @Column({ name: 'code_url' })
  codeUrl: string;

  @ApiProperty()
  @Column({ name: 'dining_table_id' })
  diningTableId: string;

  @OneToOne(() => DiningTable, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dining_table_id' })
  diningTable?: DiningTable;
}
