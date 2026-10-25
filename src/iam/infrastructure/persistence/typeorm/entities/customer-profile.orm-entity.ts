import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { UserOrmEntity } from './user.orm-entity.js';

@Entity('customer_profiles')
export class CustomerProfileOrmEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne('UserOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserOrmEntity;

  @Column({ name: 'dietary_preferences', type: 'text', nullable: true })
  dietaryPreferences: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
