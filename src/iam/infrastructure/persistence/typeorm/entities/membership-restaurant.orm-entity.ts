import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { RestaurantOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/restaurant.orm-entity.js';
import type { OrganizationMembershipOrmEntity } from './organization-membership.orm-entity.js';

// Restaurant scope of a membership when all_restaurants is FALSE. An empty
// list means no restaurant access, never "all restaurants".
@Entity('membership_restaurants')
@Index('idx_membership_restaurants_restaurant', ['restaurantId'])
export class MembershipRestaurantOrmEntity {
  @PrimaryColumn({ name: 'membership_id', type: 'uuid' })
  membershipId: string;

  @PrimaryColumn({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @ManyToOne('OrganizationMembershipOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membership_id' })
  membership?: OrganizationMembershipOrmEntity;

  @ManyToOne('RestaurantOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantOrmEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
