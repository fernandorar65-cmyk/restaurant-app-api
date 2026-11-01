import { describe, expect, it } from 'vitest';
import { Actor, PERMISSION_CODES, type AccessGrant } from './access.js';

const grant = (overrides: Partial<AccessGrant> = {}): AccessGrant => ({
  organizationId: 'org-1',
  allRestaurants: true,
  restaurantIds: [],
  permissions: new Set(['catalog.read', 'catalog.manage']),
  ...overrides,
});

describe('Actor', () => {
  it('has a read and a manage permission per area', () => {
    expect(PERMISSION_CODES).toHaveLength(20);
    expect(PERMISSION_CODES).toContain('payments.read');
    expect(PERMISSION_CODES).toContain('kitchen.manage');
  });

  it('can act in its organization with the permission of its role', () => {
    const actor = new Actor('u1', false, [grant()]);

    expect(actor.can('catalog.manage', { organizationId: 'org-1' })).toBe(true);
    expect(actor.can('payments.manage', { organizationId: 'org-1' })).toBe(
      false,
    );
    expect(actor.can(null, { organizationId: 'org-1' })).toBe(true);
  });

  it('can do nothing in an organization it does not belong to', () => {
    const actor = new Actor('u1', false, [grant()]);

    expect(actor.can(null, { organizationId: 'org-2' })).toBe(false);
    expect(actor.can('catalog.manage', { organizationId: 'org-2' })).toBe(
      false,
    );
    expect(actor.canAccess({ organizationId: 'org-2' })).toBe(false);
  });

  it('is limited to the restaurants of its membership', () => {
    const actor = new Actor('u1', false, [
      grant({ allRestaurants: false, restaurantIds: ['r1'] }),
    ]);

    expect(
      actor.can('catalog.manage', {
        organizationId: 'org-1',
        restaurantId: 'r1',
      }),
    ).toBe(true);
    expect(
      actor.can('catalog.manage', {
        organizationId: 'org-1',
        restaurantId: 'r2',
      }),
    ).toBe(false);
    // Organization-level data needs a membership covering the organization,
    // which a restaurant-limited one does too.
    expect(actor.can(null, { organizationId: 'org-1' })).toBe(true);
  });

  it('combines several memberships of the same organization', () => {
    const actor = new Actor('u1', false, [
      grant({
        allRestaurants: false,
        restaurantIds: ['r1'],
        permissions: new Set(['kitchen.manage']),
      }),
      grant({
        allRestaurants: false,
        restaurantIds: ['r2'],
        permissions: new Set(['payments.manage']),
      }),
    ]);

    expect(
      actor.can('kitchen.manage', {
        organizationId: 'org-1',
        restaurantId: 'r1',
      }),
    ).toBe(true);
    expect(
      actor.can('kitchen.manage', {
        organizationId: 'org-1',
        restaurantId: 'r2',
      }),
    ).toBe(false);
    expect(
      actor.can('payments.manage', {
        organizationId: 'org-1',
        restaurantId: 'r2',
      }),
    ).toBe(true);
    expect(actor.organizationIds).toEqual(['org-1']);
  });

  it('lets platform administrators do anything', () => {
    const admin = new Actor('acmr', true, []);

    expect(admin.can('finance.manage', { organizationId: 'any' })).toBe(true);
    expect(admin.canAccess({ organizationId: 'any', restaurantId: 'r9' })).toBe(
      true,
    );
  });
});
