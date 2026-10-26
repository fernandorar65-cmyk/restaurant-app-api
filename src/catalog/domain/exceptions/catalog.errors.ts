import {
  BusinessRuleDomainError,
  ConflictDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';

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

export class ProductIngredientNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el ingrediente "${id}" en ese producto`);
  }
}

export class CategoryNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la categoría con id "${id}"`);
  }
}

export class DuplicateCategoryNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`Ya existe una categoría llamada "${name}" en ese nivel`);
  }
}

/** Categories are organization-wide: a parent, product or menu can't mix organizations. */
export class CategoryFromAnotherOrganizationError extends ValidationDomainError {
  constructor() {
    super('La categoría pertenece a otra organización');
  }
}

export class CategoryCycleError extends ValidationDomainError {
  constructor() {
    super('Una categoría no puede quedar dentro de sí misma ni de una de sus subcategorías');
  }
}

export class InactiveCategoryError extends BusinessRuleDomainError {
  constructor() {
    super('La categoría está desactivada');
  }
}

export class ProductCategoryNotFoundError extends NotFoundDomainError {
  constructor() {
    super('El producto no está en esa categoría');
  }
}

export class DuplicateProductCategoryError extends ConflictDomainError {
  constructor() {
    super('El producto ya está en esa categoría');
  }
}

export class OrganizationReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la organización con id "${id}"`);
  }
}

export class MenuSectionNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la sección "${id}" en ese menú`);
  }
}

export class DuplicateMenuSectionNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`El menú ya tiene una sección llamada "${name}"`);
  }
}

export class InactiveMenuSectionError extends BusinessRuleDomainError {
  constructor() {
    super('La sección del menú está desactivada');
  }
}
