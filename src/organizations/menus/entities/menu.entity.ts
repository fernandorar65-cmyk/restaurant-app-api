import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Category } from '../../categories/entities/category.entity.js';
import type { Restaurant } from '../../restaurants/entities/restaurant.entity.js';

@Entity('menus')
export class Menu extends BaseEntity {
  @ApiProperty({ example: 'Menú de temporada' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'Disponible de marzo a mayo' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ example: true, default: true })
  @Column({ default: true })
  active: boolean;

  @ApiProperty()
  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne('Restaurant', (restaurant: Restaurant) => restaurant.menus, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: Restaurant;

  @OneToMany(() => Category, (category) => category.menu)
  categories?: Category[];
}
