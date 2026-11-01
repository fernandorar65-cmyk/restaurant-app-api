import { Check, Column, Entity, ForeignKey, Index, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/infrastructure/persistence/base.orm-entity.js';

// name is citext: "Carnes" and "carnes" are the same category.
@Entity('inventory_categories')
@Unique('uq_inventory_categories_organization_name', ['organizationId', 'name'])
@Index('idx_inventory_categories_organization', ['organizationId'])
@Check(
  'chk_inventory_categories_name_length',
  'char_length(name) BETWEEN 1 AND 120',
)
export class InventoryCategoryOrmEntity extends BaseOrmEntity {
  @ForeignKey('OrganizationOrmEntity', { onDelete: 'CASCADE' })
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ type: 'citext' })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
