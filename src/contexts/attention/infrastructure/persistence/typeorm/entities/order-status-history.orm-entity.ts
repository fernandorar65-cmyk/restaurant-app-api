import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../../common/persistence/base.orm-entity.js';
import { OrderStatus } from '../../../../domain/entities/order-status.enum.js';
import type { OrderOrmEntity } from './order.orm-entity.js';

@Entity('order_status_history')
export class OrderStatusHistoryOrmEntity extends BaseOrmEntity {
  @Column({ type: 'enum', enum: OrderStatus })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(
    'OrderOrmEntity',
    (order: OrderOrmEntity) => order.statusHistory,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'order_id' })
  order?: OrderOrmEntity;
}
