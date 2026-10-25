import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { OrderOrmEntity } from './order.orm-entity.js';

@Entity('order_items')
export class OrderItemOrmEntity extends BaseOrmEntity {
  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne('OrderOrmEntity', (order: OrderOrmEntity) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order?: OrderOrmEntity;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId?: string;

  @Column({ name: 'round_number', type: 'int', default: 1 })
  roundNumber: number;
}
