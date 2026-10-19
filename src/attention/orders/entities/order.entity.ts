import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { DiningTable } from '../../../organizations/dining-tables/entities/dining-table.entity.js';
import { OrderItem } from '../../order-items/entities/order-item.entity.js';
import { OrderStatusHistory } from '../../order-status-history/entities/order-status-history.entity.js';
import { OrderStatus } from './order-status.enum.js';

@Entity('orders')
export class Order extends BaseEntity {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.OPEN })
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.OPEN })
  status: OrderStatus;

  @ApiProperty({ example: 0, default: 0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @ApiProperty()
  @Column({ name: 'dining_table_id' })
  diningTableId: string;

  @ManyToOne('DiningTable', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dining_table_id' })
  diningTable?: DiningTable;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items?: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (history) => history.order)
  statusHistory?: OrderStatusHistory[];
}
