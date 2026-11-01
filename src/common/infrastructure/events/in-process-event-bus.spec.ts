import { describe, expect, it } from 'vitest';
import type { DomainEvent } from '../../domain/domain-event.js';
import type { TransactionContext } from '../../domain/transaction-context.js';
import { InProcessEventBus } from './in-process-event-bus.js';

class SomethingHappened implements DomainEvent {
  static readonly NAME = 'test.something-happened';
  readonly name = SomethingHappened.NAME;
  readonly occurredAt = new Date();

  constructor(readonly value: string) {}
}

class SomethingElse implements DomainEvent {
  static readonly NAME = 'test.something-else';
  readonly name = SomethingElse.NAME;
  readonly occurredAt = new Date();
}

const tx: TransactionContext = { kind: 'transaction-context' };

describe('InProcessEventBus', () => {
  it('runs the handlers of the event in subscription order with the transaction', async () => {
    const bus = new InProcessEventBus();
    const calls: string[] = [];
    bus.subscribe(SomethingHappened, async (event, received) => {
      calls.push(`first:${event.value}:${received === tx}`);
    });
    bus.subscribe(SomethingHappened, async (event) => {
      calls.push(`second:${event.value}`);
    });
    bus.subscribe(SomethingElse, async () => {
      calls.push('other');
    });

    await bus.publish(new SomethingHappened('a'), tx);

    expect(calls).toEqual(['first:a:true', 'second:a']);
  });

  it('does nothing when nobody subscribed', async () => {
    await expect(
      new InProcessEventBus().publish(new SomethingElse()),
    ).resolves.toBeUndefined();
  });

  it('propagates a handler failure and stops the remaining handlers', async () => {
    const bus = new InProcessEventBus();
    const calls: string[] = [];
    bus.subscribe(SomethingHappened, async () => {
      throw new Error('boom');
    });
    bus.subscribe(SomethingHappened, async () => {
      calls.push('second');
    });

    await expect(bus.publish(new SomethingHappened('a'))).rejects.toThrow(
      'boom',
    );
    expect(calls).toEqual([]);
  });
});
