import {
  ConflictDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';

export class ProductCategoryNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Product category with id "${id}" not found`);
  }
}

export class DuplicateProductCategoryNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`The restaurant already has a category named "${name}"`);
  }
}

export class ProductNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Product with id "${id}" not found`);
  }
}

export class DuplicateProductCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`The restaurant already has a product with code "${code}"`);
  }
}

export class MenuNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Menu with id "${id}" not found`);
  }
}

export class DuplicateMenuNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`The restaurant already has a menu named "${name}"`);
  }
}

export class MenuProductNotFoundError extends NotFoundDomainError {
  constructor() {
    super('The product is not part of that menu');
  }
}

export class DuplicateMenuProductError extends ConflictDomainError {
  constructor() {
    super('The product is already part of that menu');
  }
}

/** Categories, products and menus must all belong to the same restaurant. */
export class CrossRestaurantReferenceError extends ValidationDomainError {
  constructor(what: string) {
    super(`${what} belongs to another restaurant`);
  }
}

export class RestaurantReferenceNotFoundError extends NotFoundDomainError {
  constructor(idOrSlug: string) {
    super(`Restaurant "${idOrSlug}" not found`);
  }
}
