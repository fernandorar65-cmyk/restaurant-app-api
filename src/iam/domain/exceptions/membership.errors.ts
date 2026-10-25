import {
  ConflictDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';

export class MembershipNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Membership with id "${id}" not found`);
  }
}

export class DuplicateMembershipError extends ConflictDomainError {
  constructor() {
    super('The user is already a member of that organization');
  }
}

export class RoleFromAnotherOrganizationError extends ValidationDomainError {
  constructor() {
    super('The role does not belong to the membership organization');
  }
}

export class RestaurantFromAnotherOrganizationError extends ValidationDomainError {
  constructor(restaurantId: string) {
    super(`Restaurant "${restaurantId}" does not belong to the membership organization`);
  }
}
