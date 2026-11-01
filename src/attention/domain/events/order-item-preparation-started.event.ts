import type { DomainEvent } from '../../../common/domain/domain-event.js';

/**
 * The kitchen started preparing an order item (it entered IN_PREPARATION;
 * moving between the restaurant's own preparation statuses doesn't count).
 * Published after the status change is committed: whatever reacts to it
 * (e.g. inventory discounting the recipe) can never undo or block it.
 */
export class OrderItemPreparationStarted implements DomainEvent {
  static readonly NAME = 'attention.order-item-preparation-started';
  readonly name = OrderItemPreparationStarted.NAME;
  readonly occurredAt = new Date();

  constructor(
    readonly orderItemId: string,
    readonly productId: string,
    readonly quantity: number,
    readonly changedByUserId: string | null,
  ) {}
}
