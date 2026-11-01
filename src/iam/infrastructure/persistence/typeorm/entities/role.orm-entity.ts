import { Column, Entity, ForeignKey, Index, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/infrastructure/persistence/base.orm-entity.js';

@Entity('roles')
@Unique('uq_roles_organization_code', ['organizationId', 'code'])
@Index('idx_roles_organization', ['organizationId'])
export class RoleOrmEntity extends BaseOrmEntity {
  @ForeignKey('OrganizationOrmEntity', { onDelete: 'CASCADE' })
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 60 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
