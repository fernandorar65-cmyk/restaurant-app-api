/**
 * What other contexts may use from catalog. Anything not exported here is
 * internal; the boundary is enforced by the lint rule in .oxlintrc.json.
 */
export { ProductsService } from './application/products/products.service.js';
export { ProductNotFoundError } from './domain/exceptions/catalog.errors.js';
