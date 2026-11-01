import { Injectable } from '@nestjs/common';
import type {
  DomainEventHandler,
  EventBus,
} from '../../application/ports/event-bus.port.js';
import type {
  DomainEvent,
  DomainEventType,
} from '../../domain/domain-event.js';
import type { TransactionContext } from '../../domain/transaction-context.js';

/**
 * Synchronous, in-memory bus: handlers run in the publisher's process (and
 * transaction, when given). Handlers subscribe on module init.
 */
@Injectable()
export class InProcessEventBus implements EventBus {
  private readonly handlers = new Map<
    string,
    DomainEventHandler<DomainEvent>[]
  >();

  async publish(event: DomainEvent, tx?: TransactionContext): Promise<void> {
    for (const handler of this.handlers.get(event.name) ?? []) {
      await handler(event, tx);
    }
  }

  subscribe<E extends DomainEvent>(
    type: DomainEventType<E>,
    handler: DomainEventHandler<E>,
  ): void {
    const handlers = this.handlers.get(type.NAME) ?? [];
    handlers.push(handler as DomainEventHandler<DomainEvent>);
    this.handlers.set(type.NAME, handlers);
  }
}
