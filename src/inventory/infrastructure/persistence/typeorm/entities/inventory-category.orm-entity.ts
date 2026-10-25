import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { OrganizationOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/organization.orm-entity.js';

@Entity('inventory_categories')
@Unique('uq_inventory_categories_organization_name', ['organizationId', 'name'])
@Index('idx_inventory_categories_organization', ['organizationId'])
export class InventoryCategoryOrmEntity extends BaseOrmEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne('OrganizationOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationOrmEntity;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
