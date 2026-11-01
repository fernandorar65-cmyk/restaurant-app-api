import { Column, Entity, ForeignKey, Index, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/infrastructure/persistence/base.orm-entity.js';

@Entity('expense_categories')
@Unique('uq_expense_categories_organization_name', ['organizationId', 'name'])
@Index('idx_expense_categories_organization', ['organizationId'])
export class ExpenseCategoryOrmEntity extends BaseOrmEntity {
  @ForeignKey('OrganizationOrmEntity', { onDelete: 'CASCADE' })
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
