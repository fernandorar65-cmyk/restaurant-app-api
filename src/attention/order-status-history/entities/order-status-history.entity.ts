import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { OrderStatus } from '../../orders/entities/order-status.enum.js';
import type { Order } from '../../orders/entities/order.entity.js';

@Entity('order_status_history')
export class OrderStatusHistory extends BaseEntity {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.IN_PROGRESS })
  @Column({ type: 'enum', enum: OrderStatus })
  status: OrderStatus;

  @ApiPropertyOptional({ example: 'El platillo entró a cocina' })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty()
  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne('Order', (order: Order) => order.statusHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order?: Order;
}
