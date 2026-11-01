import type { DomainEvent } from '../../../common/domain/domain-event.js';

/**
 * A restaurant was created. Published inside the creating transaction, so
 * what other contexts set up for it (e.g. attention's statuses and service
 * types) is committed or rolled back together with the restaurant.
 */
export class RestaurantCreated implements DomainEvent {
  static readonly NAME = 'organizations.restaurant-created';
  readonly name = RestaurantCreated.NAME;
  readonly occurredAt = new Date();

  constructor(
    readonly restaurantId: string,
    readonly organizationId: string,
  ) {}
}
