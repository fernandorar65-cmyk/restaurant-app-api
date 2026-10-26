import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { OrganizationOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/organization.orm-entity.js';

// name is citext so uniqueness ignores case. A NULL parent never collides in a
// plain unique constraint, so root and child categories get one partial index each.
@Entity('categories')
@Index('uq_categories_root_name', ['organizationId', 'name'], {
  unique: true,
  where: 'parent_category_id IS NULL',
})
@Index('uq_categories_parent_name', ['organizationId', 'parentCategoryId', 'name'], {
  unique: true,
  where: 'parent_category_id IS NOT NULL',
})
@Index('idx_categories_parent', ['parentCategoryId'])
@Check('chk_categories_name_length', 'char_length(name) BETWEEN 1 AND 100')
@Check('chk_categories_not_own_parent', 'parent_category_id IS NULL OR parent_category_id <> id')
export class CategoryOrmEntity extends BaseOrmEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne('OrganizationOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationOrmEntity;

  @Column({ name: 'parent_category_id', type: 'uuid', nullable: true })
  parentCategoryId: string | null;

  @ManyToOne('CategoryOrmEntity')
  @JoinColumn({ name: 'parent_category_id' })
  parentCategory?: CategoryOrmEntity;

  @Column({ type: 'citext' })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
