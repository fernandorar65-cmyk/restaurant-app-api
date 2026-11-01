import { Global, Module } from '@nestjs/common';
import { EVENT_BUS } from '../../application/ports/event-bus.port.js';
import { InProcessEventBus } from './in-process-event-bus.js';

/** One bus for the whole application, shared by publishers and subscribers. */
@Global()
@Module({
  providers: [{ provide: EVENT_BUS, useClass: InProcessEventBus }],
  exports: [EVENT_BUS],
})
export class EventsModule {}
