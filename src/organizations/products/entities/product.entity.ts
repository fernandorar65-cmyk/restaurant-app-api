import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { Category } from '../../categories/entities/category.entity.js';

@Entity('products')
export class Product extends BaseEntity {
  @ApiProperty({ example: 'Ceviche' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'Pescado fresco marinado en limón' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ example: 12.5 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ example: true, default: true })
  @Column({ default: true })
  available: boolean;

  @ApiProperty()
  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne('Category', (category: Category) => category.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category?: Category;
}
