import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../../../../../../common/persistence/base.orm-entity.js';
import { CategoryOrmEntity } from './category.orm-entity.js';
import type { RestaurantOrmEntity } from './restaurant.orm-entity.js';

@Entity('menus')
export class MenuOrmEntity extends BaseOrmEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(
    'RestaurantOrmEntity',
    (restaurant: RestaurantOrmEntity) => restaurant.menus,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantOrmEntity;

  @OneToMany(() => CategoryOrmEntity, (category) => category.menu)
  categories?: CategoryOrmEntity[];
}
