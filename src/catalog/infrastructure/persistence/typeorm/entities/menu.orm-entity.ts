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
import { MenuStatus } from '../../../../domain/enums/menu-status.enum.js';
import type { RestaurantOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/restaurant.orm-entity.js';

@Entity('menus')
@Unique('uq_menus_restaurant_name', ['restaurantId', 'name'])
@Index('idx_menus_restaurant_status', ['restaurantId', 'status'])
@Check('chk_menus_status', inValues('status', Object.values(MenuStatus)))
@Check(
  'chk_menus_validity',
  'valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from',
)
export class MenuOrmEntity extends BaseOrmEntity {
  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @ManyToOne('RestaurantOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantOrmEntity;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, default: MenuStatus.DRAFT })
  status: MenuStatus;

  @Column({ name: 'valid_from', type: 'timestamptz', nullable: true })
  validFrom: Date | null;

  @Column({ name: 'valid_until', type: 'timestamptz', nullable: true })
  validUntil: Date | null;
}
