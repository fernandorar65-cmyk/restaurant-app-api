import type {
  DomainEvent,
  DomainEventType,
} from '../../domain/domain-event.js';
import type { TransactionContext } from '../../domain/transaction-context.js';

export const EVENT_BUS = Symbol('EVENT_BUS');

export type DomainEventHandler<E extends DomainEvent> = (
  event: E,
  tx?: TransactionContext,
) => Promise<void>;

/**
 * Lets a context announce what happened without knowing who reacts to it, so
 * the dependency points from the subscriber to the publisher and never back.
 */
export interface EventBus {
  /**
   * Runs every handler of the event one after the other and waits for them.
   * With `tx` they run inside that transaction and a failure rolls it back;
   * an event that must not undo the publisher's work is published after the
   * commit, without `tx`, and its handlers decide how to deal with failures.
   */
  publish(event: DomainEvent, tx?: TransactionContext): Promise<void>;
  subscribe<E extends DomainEvent>(
    type: DomainEventType<E>,
    handler: DomainEventHandler<E>,
  ): void;
}
