import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { Restaurant } from '../../restaurants/entities/restaurant.entity.js';

export enum DiningTableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
}

@Entity('dining_tables')
export class DiningTable extends BaseEntity {
  @ApiProperty({ example: 'A1' })
  @Column({ name: 'table_number' })
  tableNumber: string;

  @ApiProperty({ example: 4 })
  @Column({ type: 'int' })
  capacity: number;

  @ApiProperty({ enum: DiningTableStatus, example: DiningTableStatus.AVAILABLE })
  @Column({
    type: 'enum',
    enum: DiningTableStatus,
    default: DiningTableStatus.AVAILABLE,
  })
  status: DiningTableStatus;

  @ApiProperty()
  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne('Restaurant', (restaurant: Restaurant) => restaurant.diningTables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: Restaurant;
}
