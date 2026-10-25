import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { inValues } from '../../../../../common/persistence/column-options.js';
import { MembershipStatus } from '../../../../domain/enums/membership-status.enum.js';
import type { OrganizationOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/organization.orm-entity.js';
import type { RoleOrmEntity } from './role.orm-entity.js';
import type { UserOrmEntity } from './user.orm-entity.js';

@Entity('organization_memberships')
@Unique('uq_memberships_organization_user', ['organizationId', 'userId'])
@Index('idx_memberships_user', ['userId'])
@Index('idx_memberships_role', ['roleId'])
@Check(
  'chk_memberships_status',
  inValues('status', Object.values(MembershipStatus)),
)
export class OrganizationMembershipOrmEntity extends BaseOrmEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne('OrganizationOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationOrmEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne('UserOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserOrmEntity;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne('RoleOrmEntity')
  @JoinColumn({ name: 'role_id' })
  role?: RoleOrmEntity;

  @Column({ name: 'all_restaurants', type: 'boolean', default: false })
  allRestaurants: boolean;

  @Column({ type: 'varchar', length: 20, default: MembershipStatus.ACTIVE })
  status: MembershipStatus;

  @Column({
    name: 'joined_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  joinedAt: Date;
}
