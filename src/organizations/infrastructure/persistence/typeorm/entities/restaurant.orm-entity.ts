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
import { RestaurantStatus } from '../../../../domain/enums/restaurant-status.enum.js';
import type { OrganizationOrmEntity } from './organization.orm-entity.js';

@Entity('restaurants')
@Unique('uq_restaurants_organization_code', ['organizationId', 'code'])
@Unique('uq_restaurants_slug', ['slug'])
@Index('idx_restaurants_organization', ['organizationId'])
@Check(
  'chk_restaurants_status',
  inValues('status', Object.values(RestaurantStatus)),
)
@Check(
  'chk_restaurants_latitude',
  'latitude IS NULL OR latitude BETWEEN -90 AND 90',
)
@Check(
  'chk_restaurants_longitude',
  'longitude IS NULL OR longitude BETWEEN -180 AND 180',
)
export class RestaurantOrmEntity extends BaseOrmEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne('OrganizationOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationOrmEntity;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 180 })
  slug: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    nullable: true,
    transformer: decimalTransformer,
  })
  latitude: number | null;

  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    nullable: true,
    transformer: decimalTransformer,
  })
  longitude: number | null;

  @Column({ name: 'currency_code', type: 'char', length: 3, default: 'PEN' })
  currencyCode: string;

  @Column({ type: 'varchar', length: 80, default: 'America/Lima' })
  timezone: string;

  @Column({ type: 'varchar', length: 20, default: RestaurantStatus.ACTIVE })
  status: RestaurantStatus;
}
