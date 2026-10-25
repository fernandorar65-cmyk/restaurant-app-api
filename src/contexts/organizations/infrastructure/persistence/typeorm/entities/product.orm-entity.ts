import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../../common/persistence/base.orm-entity.js';
import type { CategoryOrmEntity } from './category.orm-entity.js';

@Entity('products')
export class ProductOrmEntity extends BaseOrmEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: true })
  available: boolean;

  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(
    'CategoryOrmEntity',
    (category: CategoryOrmEntity) => category.products,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'category_id' })
  category?: CategoryOrmEntity;
}
