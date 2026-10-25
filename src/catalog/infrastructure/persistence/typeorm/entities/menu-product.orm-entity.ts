import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { decimalTransformer } from '../../../../../common/persistence/column-options.js';
import type { MenuOrmEntity } from './menu.orm-entity.js';
import type { ProductOrmEntity } from './product.orm-entity.js';

@Entity('menu_products')
@Index('idx_menu_products_product', ['productId'])
@Check(
  'chk_menu_products_price',
  'display_price IS NULL OR display_price >= 0',
)
export class MenuProductOrmEntity {
  @PrimaryColumn({ name: 'menu_id', type: 'uuid' })
  menuId: string;

  @PrimaryColumn({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne('MenuOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu?: MenuOrmEntity;

  @ManyToOne('ProductOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductOrmEntity;

  @Column({
    name: 'display_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  displayPrice: number | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_visible', type: 'boolean', default: true })
  isVisible: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
