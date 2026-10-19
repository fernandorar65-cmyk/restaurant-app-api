import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { Restaurant } from '../../restaurants/entities/restaurant.entity.js';

@Entity('employees')
export class Employee extends BaseEntity {
  @ApiProperty({ example: 'Carlos Ruiz' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'carlos@restaurant.com' })
  @Column({ nullable: true })
  email?: string;

  @ApiProperty({ example: 'waiter' })
  @Column()
  position: string;

  @ApiProperty()
  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne('Restaurant', (restaurant: Restaurant) => restaurant.employees, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: Restaurant;
}
