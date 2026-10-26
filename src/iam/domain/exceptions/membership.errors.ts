import {
  ConflictDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';

export class MembershipNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la membresía con id "${id}"`);
  }
}

export class DuplicateMembershipError extends ConflictDomainError {
  constructor() {
    super('El usuario ya es miembro de esa organización');
  }
}

export class RoleFromAnotherOrganizationError extends ValidationDomainError {
  constructor() {
    super('El rol no pertenece a la organización de la membresía');
  }
}

export class RestaurantFromAnotherOrganizationError extends ValidationDomainError {
  constructor(restaurantId: string) {
    super(`El restaurante "${restaurantId}" no pertenece a la organización de la membresía`);
  }
}
