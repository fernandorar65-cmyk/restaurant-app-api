import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { User } from '../../../iam/users/entities/user.entity.js';
import type { Product } from '../../../organizations/products/entities/product.entity.js';
import type { Order } from '../../orders/entities/order.entity.js';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @ApiProperty({ example: 2 })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ example: 12.5 })
  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ApiPropertyOptional({ example: 'Sin cebolla' })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty()
  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne('Order', (order: Order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order?: Order;

  @ApiProperty()
  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne('Product', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @ApiPropertyOptional()
  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne('User', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
