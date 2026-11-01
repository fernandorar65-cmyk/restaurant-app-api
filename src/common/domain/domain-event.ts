/**
 * Something that happened in a context and that other contexts may react to.
 * Each event class declares a static `NAME` (e.g. `organizations.restaurant-created`)
 * that identifies it on the event bus.
 */
export interface DomainEvent {
  readonly name: string;
  readonly occurredAt: Date;
}

/** An event class, used to subscribe to its events. */
export interface DomainEventType<E extends DomainEvent> {
  readonly NAME: string;
  new (...args: never[]): E;
}
