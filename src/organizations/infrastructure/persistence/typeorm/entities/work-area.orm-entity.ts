import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { OrganizationOrmEntity } from './organization.orm-entity.js';

// name is citext so the unique constraint ignores case ("Cocina" = "cocina").
@Entity('work_areas')
@Unique('uq_work_areas_organization_name', ['organizationId', 'name'])
@Index('idx_work_areas_organization', ['organizationId'])
@Check('chk_work_areas_name_length', 'char_length(name) BETWEEN 1 AND 100')
export class WorkAreaOrmEntity extends BaseOrmEntity {
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
