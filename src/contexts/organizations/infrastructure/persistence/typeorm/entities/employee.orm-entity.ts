import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../../common/persistence/base.orm-entity.js';
import type { RestaurantOrmEntity } from './restaurant.orm-entity.js';

@Entity('employees')
export class EmployeeOrmEntity extends BaseOrmEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
  position: string;

  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(
    'RestaurantOrmEntity',
    (restaurant: RestaurantOrmEntity) => restaurant.employees,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantOrmEntity;
}
