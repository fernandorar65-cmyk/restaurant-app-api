import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class RestaurantNotFoundError extends NotFoundDomainError {
  constructor(idOrSlug: string) {
    super(`No existe el restaurante "${idOrSlug}"`);
  }
}

export class DuplicateRestaurantCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`La organización ya tiene un restaurante con el código "${code}"`);
  }
}

export class DuplicateRestaurantSlugError extends ConflictDomainError {
  constructor(slug: string) {
    super(`Ya existe un restaurante con el slug "${slug}"`);
  }
}
