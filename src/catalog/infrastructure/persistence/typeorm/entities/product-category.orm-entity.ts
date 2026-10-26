import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import type { CategoryOrmEntity } from './category.orm-entity.js';
import type { ProductOrmEntity } from './product.orm-entity.js';

/** A product can belong to several categories. */
@Entity('product_categories')
@Index('idx_product_categories_category', ['categoryId'])
export class ProductCategoryOrmEntity {
  @PrimaryColumn({ name: 'product_id', type: 'uuid' })
  productId: string;

  @PrimaryColumn({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne('ProductOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductOrmEntity;

  @ManyToOne('CategoryOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category?: CategoryOrmEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
