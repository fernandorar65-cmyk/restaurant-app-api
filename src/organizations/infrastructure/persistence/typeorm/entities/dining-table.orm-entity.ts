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
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/persistence/column-options.js';
import { TableOperationalStatus } from '../../../../domain/enums/table-operational-status.enum.js';
import { TableServiceStatus } from '../../../../domain/enums/table-service-status.enum.js';
import type { RestaurantFloorOrmEntity } from './restaurant-floor.orm-entity.js';
import type { RestaurantOrmEntity } from './restaurant.orm-entity.js';

// "Occupied" is not stored: it is derived from an active attention on the table.
@Entity('dining_tables')
@Unique('uq_tables_restaurant_code', ['restaurantId', 'code'])
@Index('idx_tables_floor', ['floorId'])
@Check('chk_tables_capacity', 'capacity IS NULL OR capacity > 0')
@Check(
  'chk_tables_operational_status',
  inValues('operational_status', Object.values(TableOperationalStatus)),
)
@Check(
  'chk_tables_service_status',
  inValues('service_status', Object.values(TableServiceStatus)),
)
export class DiningTableOrmEntity extends BaseOrmEntity {
  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @ManyToOne('RestaurantOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantOrmEntity;

  @Column({ name: 'floor_id', type: 'uuid' })
  floorId: string;

  @ManyToOne('RestaurantFloorOrmEntity')
  @JoinColumn({ name: 'floor_id' })
  floor?: RestaurantFloorOrmEntity;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column({
    name: 'operational_status',
    type: 'varchar',
    length: 20,
    default: TableOperationalStatus.ACTIVE,
  })
  operationalStatus: TableOperationalStatus;

  @Column({
    name: 'service_status',
    type: 'varchar',
    length: 20,
    default: TableServiceStatus.AVAILABLE,
  })
  serviceStatus: TableServiceStatus;

  @Column({
    name: 'position_x',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  positionX: number | null;

  @Column({
    name: 'position_y',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  positionY: number | null;
}
