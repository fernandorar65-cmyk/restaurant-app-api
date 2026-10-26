import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { OrganizationOrmEntity } from './organization.orm-entity.js';
import type { WorkAreaOrmEntity } from './work-area.orm-entity.js';

// name is citext so the unique constraint ignores case ("Mozo" = "mozo").
@Entity('job_positions')
@Unique('uq_job_positions_organization_area_name', [
  'organizationId',
  'workAreaId',
  'name',
])
@Index('idx_job_positions_organization', ['organizationId'])
@Index('idx_job_positions_work_area', ['workAreaId'])
@Check('chk_job_positions_name_length', 'char_length(name) BETWEEN 1 AND 100')
export class JobPositionOrmEntity extends BaseOrmEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne('OrganizationOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationOrmEntity;

  @Column({ name: 'work_area_id', type: 'uuid' })
  workAreaId: string;

  @ManyToOne('WorkAreaOrmEntity')
  @JoinColumn({ name: 'work_area_id' })
  workArea?: WorkAreaOrmEntity;

  @Column({ type: 'citext' })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
