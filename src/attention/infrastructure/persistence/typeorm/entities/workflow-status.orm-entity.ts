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
import { AttentionStatus } from '../../../../domain/enums/attention-status.enum.js';
import { OrderStatus } from '../../../../domain/enums/order-status.enum.js';
import {
  ATTENTION_WORKFLOW,
  ORDER_WORKFLOW,
} from '../../../../domain/workflows.js';
import type { RestaurantOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/restaurant.orm-entity.js';

// Shared columns of the two configurable status catalogs. code, name, color
// and sort_order belong to the restaurant; canonical_state is what the
// backend acts on, and is_final follows from it.
abstract class WorkflowStatusOrmEntity<C extends string> extends BaseOrmEntity {
  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @ManyToOne('RestaurantOrmEntity')
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantOrmEntity;

  @Column({ type: 'varchar', length: 30 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'canonical_state', type: 'varchar', length: 30 })
  canonicalState: C;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string | null;

  @Column({ name: 'sort_order', type: 'int' })
  sortOrder: number;

  @Column({ name: 'is_initial', type: 'boolean', default: false })
  isInitial: boolean;

  @Column({ name: 'is_final', type: 'boolean', default: false })
  isFinal: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}

const finals = (states: readonly string[]) =>
  states.map((state) => `'${state}'`).join(', ');

@Entity('attention_statuses')
@Unique('uq_attention_statuses_restaurant_code', ['restaurantId', 'code'])
@Index('uq_attention_statuses_initial', ['restaurantId'], {
  unique: true,
  where: 'is_initial AND is_active',
})
@Check(
  'chk_attention_statuses_canonical',
  inValues('canonical_state', Object.values(AttentionStatus)),
)
@Check('chk_attention_statuses_code', "code ~ '^[A-Z][A-Z0-9_]*$'")
@Check(
  'chk_attention_statuses_color',
  "color IS NULL OR color ~ '^#[0-9A-F]{6}$'",
)
@Check('chk_attention_statuses_sort_order', 'sort_order >= 0')
@Check(
  'chk_attention_statuses_initial',
  `NOT is_initial OR canonical_state = '${ATTENTION_WORKFLOW.initial}'`,
)
@Check(
  'chk_attention_statuses_final',
  `is_final = (canonical_state IN (${finals(ATTENTION_WORKFLOW.finals)}))`,
)
export class AttentionStatusOrmEntity extends WorkflowStatusOrmEntity<AttentionStatus> {}

@Entity('order_statuses')
@Unique('uq_order_statuses_restaurant_code', ['restaurantId', 'code'])
@Index('uq_order_statuses_initial', ['restaurantId'], {
  unique: true,
  where: 'is_initial AND is_active',
})
@Check(
  'chk_order_statuses_canonical',
  inValues('canonical_state', Object.values(OrderStatus)),
)
@Check('chk_order_statuses_code', "code ~ '^[A-Z][A-Z0-9_]*$'")
@Check('chk_order_statuses_color', "color IS NULL OR color ~ '^#[0-9A-F]{6}$'")
@Check('chk_order_statuses_sort_order', 'sort_order >= 0')
@Check(
  'chk_order_statuses_initial',
  `NOT is_initial OR canonical_state = '${ORDER_WORKFLOW.initial}'`,
)
@Check(
  'chk_order_statuses_final',
  `is_final = (canonical_state IN (${finals(ORDER_WORKFLOW.finals)}))`,
)
export class OrderStatusOrmEntity extends WorkflowStatusOrmEntity<OrderStatus> {}
