import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { AllergenOrmEntity } from './allergen.orm-entity.js';
import type { ProductOrmEntity } from './product.orm-entity.js';

@Entity('product_allergens')
export class ProductAllergenOrmEntity {
  @PrimaryColumn({ name: 'product_id', type: 'uuid' })
  productId: string;

  @PrimaryColumn({ name: 'allergen_id', type: 'uuid' })
  allergenId: string;

  @ManyToOne('ProductOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductOrmEntity;

  @ManyToOne('AllergenOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'allergen_id' })
  allergen?: AllergenOrmEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
