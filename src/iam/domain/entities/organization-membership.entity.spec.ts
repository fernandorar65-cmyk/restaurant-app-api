import { MembershipStatus } from '../enums/membership-status.enum.js';
import { OrganizationMembership } from './organization-membership.entity.js';

function createMembership(
  scope: { allRestaurants?: boolean; restaurantIds?: string[] } = {},
): OrganizationMembership {
  return OrganizationMembership.create({
    id: 'membership-1',
    organizationId: 'org-1',
    userId: 'user-1',
    roleId: 'role-waiter',
    ...scope,
  });
}

describe('OrganizationMembership', () => {
  it('starts active with no restaurant access by default', () => {
    const membership = createMembership();
    expect(membership.status).toBe(MembershipStatus.ACTIVE);
    expect(membership.allRestaurants).toBe(false);
    expect(membership.restaurantIds).toEqual([]);
    // An empty list never means "all restaurants".
    expect(membership.canAccessRestaurant('r1')).toBe(false);
  });

  it('grants access only to the listed restaurants, without duplicates', () => {
    const membership = createMembership({ restaurantIds: ['r1', 'r2', 'r1'] });
    expect(membership.restaurantIds).toEqual(['r1', 'r2']);
    expect(membership.canAccessRestaurant('r1')).toBe(true);
    expect(membership.canAccessRestaurant('r3')).toBe(false);
  });

  it('grants access to every restaurant and drops the explicit list', () => {
    const membership = createMembership({
      allRestaurants: true,
      restaurantIds: ['r1'],
    });
    expect(membership.restaurantIds).toEqual([]);
    expect(membership.canAccessRestaurant('any')).toBe(true);
  });

  it('can narrow the scope later', () => {
    const membership = createMembership({ allRestaurants: true });
    membership.changeScope(false, ['r2']);
    expect(membership.allRestaurants).toBe(false);
    expect(membership.canAccessRestaurant('r1')).toBe(false);
    expect(membership.canAccessRestaurant('r2')).toBe(true);
  });

  it.each([
    MembershipStatus.INACTIVE,
    MembershipStatus.INVITED,
    MembershipStatus.SUSPENDED,
  ])('denies access while %s', (status) => {
    const membership = createMembership({ allRestaurants: true });
    membership.changeStatus(status);
    expect(membership.canAccessRestaurant('r1')).toBe(false);
  });

  it('changes role', () => {
    const membership = createMembership();
    membership.changeRole('role-manager');
    expect(membership.roleId).toBe('role-manager');
  });

  it('does not expose its internal list for mutation', () => {
    const membership = createMembership({ restaurantIds: ['r1'] });
    membership.restaurantIds.push('r2');
    expect(membership.canAccessRestaurant('r2')).toBe(false);
  });
});
