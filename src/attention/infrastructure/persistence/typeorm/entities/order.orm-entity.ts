import { Column, Entity, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { OrderStatus } from '../../../../domain/entities/order-status.enum.js';
import { OrderItemOrmEntity } from './order-item.orm-entity.js';
import { OrderStatusHistoryOrmEntity } from './order-status-history.orm-entity.js';

@Entity('orders')
export class OrderOrmEntity extends BaseOrmEntity {
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.OPEN })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ name: 'dining_table_id', type: 'uuid' })
  diningTableId: string;

  @OneToMany(() => OrderItemOrmEntity, (orderItem) => orderItem.order)
  items?: OrderItemOrmEntity[];

  @OneToMany(() => OrderStatusHistoryOrmEntity, (history) => history.order)
  statusHistory?: OrderStatusHistoryOrmEntity[];
}
