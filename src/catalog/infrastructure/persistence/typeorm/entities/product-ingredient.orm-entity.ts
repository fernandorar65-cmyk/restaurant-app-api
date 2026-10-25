import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { ProductOrmEntity } from './product.orm-entity.js';

@Entity('product_ingredients')
export class ProductIngredientOrmEntity extends BaseOrmEntity {
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne('ProductOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductOrmEntity;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_visible', type: 'boolean', default: true })
  isVisible: boolean;
}
