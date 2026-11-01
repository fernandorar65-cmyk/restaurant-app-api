import {
  CreateDateColumn,
  Entity,
  ForeignKey,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { OrganizationMembershipOrmEntity } from './organization-membership.orm-entity.js';

// Restaurant scope of a membership when all_restaurants is FALSE. An empty
// list means no restaurant access, never "all restaurants".
@Entity('membership_restaurants')
@Index('idx_membership_restaurants_restaurant', ['restaurantId'])
export class MembershipRestaurantOrmEntity {
  @PrimaryColumn({ name: 'membership_id', type: 'uuid' })
  membershipId: string;

  @ForeignKey('RestaurantOrmEntity', { onDelete: 'CASCADE' })
  @PrimaryColumn({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @ManyToOne('OrganizationMembershipOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membership_id' })
  membership?: OrganizationMembershipOrmEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
