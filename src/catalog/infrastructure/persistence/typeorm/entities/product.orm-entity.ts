import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/persistence/column-options.js';
import { ProductStatus } from '../../../../domain/enums/product-status.enum.js';
import type { RestaurantOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/restaurant.orm-entity.js';
import type { ProductCategoryOrmEntity } from './product-category.orm-entity.js';

@Entity('products')
@Unique('uq_products_restaurant_code', ['restaurantId', 'code'])
@Index('idx_products_restaurant_category', ['restaurantId', 'categoryId'])
@Index('idx_products_available', ['restaurantId', 'isAvailable', 'status'])
@Check('chk_products_price', 'price >= 0')
@Check(
  'chk_products_preparation',
  'preparation_minutes IS NULL OR preparation_minutes >= 0',
)
@Check('chk_products_status', inValues('status', Object.values(ProductStatus)))
export class ProductOrmEntity extends BaseOrmEntity {
  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @ManyToOne('RestaurantOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantOrmEntity;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne('ProductCategoryOrmEntity')
  @JoinColumn({ name: 'category_id' })
  category?: ProductCategoryOrmEntity;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 800, nullable: true })
  description: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 1000, nullable: true })
  imageUrl: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  price: number;

  @Column({ name: 'preparation_minutes', type: 'int', nullable: true })
  preparationMinutes: number | null;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ name: 'is_takeaway_allowed', type: 'boolean', default: true })
  isTakeawayAllowed: boolean;

  @Column({ name: 'is_delivery_allowed', type: 'boolean', default: true })
  isDeliveryAllowed: boolean;

  @Column({ type: 'varchar', length: 20, default: ProductStatus.ACTIVE })
  status: ProductStatus;
}
