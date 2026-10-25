import { Column, Entity, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { FulfillmentType } from '../../../../domain/entities/fulfillment-type.enum.js';
import { OrderStatus } from '../../../../domain/entities/order-status.enum.js';
import { OrderItemOrmEntity } from './order-item.orm-entity.js';
import { OrderStatusHistoryOrmEntity } from './order-status-history.orm-entity.js';

@Entity('orders')
export class OrderOrmEntity extends BaseOrmEntity {
  @Column()
  code: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.OPEN })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({
    name: 'fulfillment_type',
    type: 'enum',
    enum: FulfillmentType,
    default: FulfillmentType.DINE_IN,
  })
  fulfillmentType: FulfillmentType;

  @Column({ name: 'dining_table_id', type: 'uuid', nullable: true })
  diningTableId: string | null;

  @Column({ name: 'delivery_address', type: 'varchar', nullable: true })
  deliveryAddress: string | null;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ name: 'guest_token', type: 'varchar', nullable: true })
  guestToken: string | null;

  @Column({ name: 'bill_requested_at', type: 'timestamp', nullable: true })
  billRequestedAt: Date | null;

  @OneToMany(() => OrderItemOrmEntity, (orderItem) => orderItem.order)
  items?: OrderItemOrmEntity[];

  @OneToMany(() => OrderStatusHistoryOrmEntity, (history) => history.order)
  statusHistory?: OrderStatusHistoryOrmEntity[];
}
