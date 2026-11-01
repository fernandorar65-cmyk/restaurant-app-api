import type { DomainEvent } from '../../../common/domain/domain-event.js';

/**
 * An organization was created. Published inside the creating transaction, so
 * what other contexts set up for it (e.g. IAM's base roles) is committed or
 * rolled back together with the organization.
 */
export class OrganizationCreated implements DomainEvent {
  static readonly NAME = 'organizations.organization-created';
  readonly name = OrganizationCreated.NAME;
  readonly occurredAt = new Date();

  constructor(readonly organizationId: string) {}
}
