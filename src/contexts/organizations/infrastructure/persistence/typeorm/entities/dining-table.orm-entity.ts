import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../../common/persistence/base.orm-entity.js';
import { DiningTableStatus } from '../../../../domain/entities/dining-table.entity.js';
import type { RestaurantOrmEntity } from './restaurant.orm-entity.js';

@Entity('dining_tables')
export class DiningTableOrmEntity extends BaseOrmEntity {
  @Column({ name: 'table_number' })
  tableNumber: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({
    type: 'enum',
    enum: DiningTableStatus,
    default: DiningTableStatus.AVAILABLE,
  })
  status: DiningTableStatus;

  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(
    'RestaurantOrmEntity',
    (restaurant: RestaurantOrmEntity) => restaurant.diningTables,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantOrmEntity;
}
