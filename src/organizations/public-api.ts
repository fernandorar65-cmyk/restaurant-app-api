/**
 * What other contexts may use from organizations. Anything not exported here
 * is internal; the boundary is enforced by the lint rule in .oxlintrc.json.
 */
export { DiningTablesService } from './application/dining-tables/dining-tables.service.js';
export { OrganizationsService } from './application/organizations/organizations.service.js';
export { RestaurantsService } from './application/restaurants/restaurants.service.js';
export { OrganizationCreated } from './domain/events/organization-created.event.js';
export { RestaurantCreated } from './domain/events/restaurant-created.event.js';
export { DiningTableNotFoundError } from './domain/exceptions/dining-table.errors.js';
