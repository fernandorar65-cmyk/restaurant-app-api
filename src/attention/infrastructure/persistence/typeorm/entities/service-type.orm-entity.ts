import { Check, Column, Entity, ForeignKey, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/infrastructure/persistence/base.orm-entity.js';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/infrastructure/persistence/column-options.js';
import { FulfillmentMode } from '../../../../domain/enums/fulfillment-mode.enum.js';

// Service types a restaurant offers, named and ordered by it. The backend
// rules (table, delivery data, fee) follow fulfillment_mode.
@Entity('service_types')
@Unique('uq_service_types_restaurant_code', ['restaurantId', 'code'])
@Check(
  'chk_service_types_fulfillment_mode',
  inValues('fulfillment_mode', Object.values(FulfillmentMode)),
)
@Check('chk_service_types_code', "code ~ '^[A-Z][A-Z0-9_]*$'")
@Check('chk_service_types_minimum', 'minimum_order_amount >= 0')
@Check('chk_service_types_fee', 'delivery_fee >= 0')
@Check('chk_service_types_sort_order', 'sort_order >= 0')
@Check(
  'chk_service_types_requirements',
  `(NOT requires_table OR fulfillment_mode = '${FulfillmentMode.DINE_IN}') AND (NOT requires_customer_address OR fulfillment_mode = '${FulfillmentMode.DELIVERY}')`,
)
export class ServiceTypeOrmEntity extends BaseOrmEntity {
  @ForeignKey('RestaurantOrmEntity')
  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @Column({ type: 'varchar', length: 30 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'fulfillment_mode', type: 'varchar', length: 20 })
  fulfillmentMode: FulfillmentMode;

  @Column({ name: 'requires_table', type: 'boolean', default: false })
  requiresTable: boolean;

  @Column({
    name: 'requires_customer_address',
    type: 'boolean',
    default: false,
  })
  requiresCustomerAddress: boolean;

  @Column({
    name: 'minimum_order_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  minimumOrderAmount: number;

  @Column({
    name: 'delivery_fee',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  deliveryFee: number;

  @Column({ name: 'sort_order', type: 'int' })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
