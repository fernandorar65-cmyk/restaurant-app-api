import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { UserOrmEntity } from '../../../../../iam/infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import type { ProductOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/product.orm-entity.js';
import type { OrderOrmEntity } from './order.orm-entity.js';

@Entity('order_items')
export class OrderItemOrmEntity extends BaseOrmEntity {
  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne('OrderOrmEntity', (order: OrderOrmEntity) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order?: OrderOrmEntity;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne('ProductOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductOrmEntity;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne('UserOrmEntity', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UserOrmEntity;
}
