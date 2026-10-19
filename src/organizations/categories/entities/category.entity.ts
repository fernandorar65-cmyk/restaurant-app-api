import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { Menu } from '../../menus/entities/menu.entity.js';
import { Product } from '../../products/entities/product.entity.js';

@Entity('categories')
export class Category extends BaseEntity {
  @ApiProperty({ example: 'Entradas' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'Platillos para abrir el apetito' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty()
  @Column({ name: 'menu_id' })
  menuId: string;

  @ManyToOne('Menu', (menu: Menu) => menu.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu?: Menu;

  @OneToMany(() => Product, (product) => product.category)
  products?: Product[];
}
