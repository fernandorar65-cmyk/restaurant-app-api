import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';

export class RestaurantNotFoundError extends NotFoundDomainError {
  constructor(idOrSlug: string) {
    super(`Restaurant "${idOrSlug}" not found`);
  }
}

export class DuplicateRestaurantCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`The organization already has a restaurant with code "${code}"`);
  }
}

export class DuplicateRestaurantSlugError extends ConflictDomainError {
  constructor(slug: string) {
    super(`A restaurant with slug "${slug}" already exists`);
  }
}
