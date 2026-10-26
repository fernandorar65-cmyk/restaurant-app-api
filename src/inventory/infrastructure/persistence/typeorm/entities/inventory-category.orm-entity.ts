import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { OrganizationOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/organization.orm-entity.js';

// name is citext: "Carnes" and "carnes" are the same category.
@Entity('inventory_categories')
@Unique('uq_inventory_categories_organization_name', ['organizationId', 'name'])
@Index('idx_inventory_categories_organization', ['organizationId'])
@Check('chk_inventory_categories_name_length', 'char_length(name) BETWEEN 1 AND 120')
export class InventoryCategoryOrmEntity extends BaseOrmEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne('OrganizationOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationOrmEntity;

  @Column({ type: 'citext' })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
