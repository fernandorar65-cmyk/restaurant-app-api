import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalTransformer } from '../../../../../common/persistence/column-options.js';
import type { ProductOrmEntity } from '../../../../../catalog/infrastructure/persistence/typeorm/entities/product.orm-entity.js';
import type { SupplyOrmEntity } from './supply.orm-entity.js';

@Entity('product_recipes')
@Index('idx_recipes_supply', ['supplyId'])
@Check('chk_recipes_quantity', 'quantity_required > 0')
@Check('chk_recipes_waste', 'waste_percentage BETWEEN 0 AND 100')
export class ProductRecipeOrmEntity {
  @PrimaryColumn({ name: 'product_id', type: 'uuid' })
  productId: string;

  @PrimaryColumn({ name: 'supply_id', type: 'uuid' })
  supplyId: string;

  @ManyToOne('ProductOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductOrmEntity;

  @ManyToOne('SupplyOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supply_id' })
  supply?: SupplyOrmEntity;

  @Column({
    name: 'quantity_required',
    type: 'numeric',
    precision: 14,
    scale: 3,
    transformer: decimalTransformer,
  })
  quantityRequired: number;

  @Column({
    name: 'waste_percentage',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  wastePercentage: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
