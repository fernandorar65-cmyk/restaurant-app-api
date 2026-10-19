import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { Restaurant } from '../../restaurants/entities/restaurant.entity.js';

@Entity('kitchen_supplies')
export class KitchenSupply extends BaseEntity {
  @ApiProperty({ example: 'Aceite de oliva' })
  @Column()
  name: string;

  @ApiProperty({ example: 'litro' })
  @Column()
  unit: string;

  @ApiProperty({ example: 10.5 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantity: number;

  @ApiProperty()
  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne('Restaurant', (restaurant: Restaurant) => restaurant.kitchenSupplies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: Restaurant;
}
