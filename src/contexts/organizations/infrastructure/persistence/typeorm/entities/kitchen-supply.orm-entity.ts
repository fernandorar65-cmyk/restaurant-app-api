import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../../common/persistence/base.orm-entity.js';
import type { RestaurantOrmEntity } from './restaurant.orm-entity.js';

@Entity('kitchen_supplies')
export class KitchenSupplyOrmEntity extends BaseOrmEntity {
  @Column()
  name: string;

  @Column()
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantity: number;

  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(
    'RestaurantOrmEntity',
    (restaurant: RestaurantOrmEntity) => restaurant.kitchenSupplies,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantOrmEntity;
}
