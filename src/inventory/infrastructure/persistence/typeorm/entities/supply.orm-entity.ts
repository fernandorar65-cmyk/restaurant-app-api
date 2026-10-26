import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { OrganizationOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/organization.orm-entity.js';
import type { InventoryCategoryOrmEntity } from './inventory-category.orm-entity.js';
import type { UnitOfMeasureOrmEntity } from './unit-of-measure.orm-entity.js';

// Master catalog of the organization: registered once, used by every
// restaurant through restaurant_supplies. No stock columns here.
@Entity('supplies')
@Unique('uq_supplies_organization_code', ['organizationId', 'code'])
@Index('idx_supplies_category', ['categoryId'])
@Index('idx_supplies_base_unit', ['baseUnitId'])
export class SupplyOrmEntity extends BaseOrmEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne('OrganizationOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationOrmEntity;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne('InventoryCategoryOrmEntity')
  @JoinColumn({ name: 'category_id' })
  category?: InventoryCategoryOrmEntity;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'base_unit_id', type: 'uuid' })
  baseUnitId: string;

  @ManyToOne('UnitOfMeasureOrmEntity', { eager: true })
  @JoinColumn({ name: 'base_unit_id' })
  baseUnit: UnitOfMeasureOrmEntity;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
