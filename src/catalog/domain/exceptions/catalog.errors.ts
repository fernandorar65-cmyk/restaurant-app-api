import {
  ConflictDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';

export class ProductCategoryNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la categoría con id "${id}"`);
  }
}

export class DuplicateProductCategoryNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`La sede ya tiene una categoría llamada "${name}"`);
  }
}

export class ProductNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el producto con id "${id}"`);
  }
}

export class DuplicateProductCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`La sede ya tiene un producto con el código "${code}"`);
  }
}

export class MenuNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el menú con id "${id}"`);
  }
}

export class DuplicateMenuNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`La sede ya tiene un menú llamado "${name}"`);
  }
}

export class MenuProductNotFoundError extends NotFoundDomainError {
  constructor() {
    super('El producto no forma parte de ese menú');
  }
}

export class DuplicateMenuProductError extends ConflictDomainError {
  constructor() {
    super('El producto ya forma parte de ese menú');
  }
}

/** Categories, products and menus must all belong to the same restaurant. */
export class CrossRestaurantReferenceError extends ValidationDomainError {
  constructor(what: string) {
    super(`${what} pertenece a otra sede`);
  }
}

export class RestaurantReferenceNotFoundError extends NotFoundDomainError {
  constructor(idOrSlug: string) {
    super(`No existe el restaurante "${idOrSlug}"`);
  }
}

export class AllergenNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el alérgeno con id "${id}"`);
  }
}

export class DuplicateAllergenCodeError extends ConflictDomainError {
  constructor(code: string) {
    super(`El alérgeno "${code}" ya existe`);
  }
}

export class ProductAllergenNotFoundError extends NotFoundDomainError {
  constructor() {
    super('El producto no tiene ese alérgeno');
  }
}

export class DuplicateProductAllergenError extends ConflictDomainError {
  constructor() {
    super('El producto ya tiene ese alérgeno');
  }
}

export class ProductIngredientNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el ingrediente "${id}" en ese producto`);
  }
}
