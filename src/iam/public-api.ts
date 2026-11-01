/**
 * What other contexts may use from iam. Anything not exported here is
 * internal; the boundary is enforced by the lint rule in .oxlintrc.json.
 */
export { AuthService } from './application/auth/auth.service.js';
export { UsersService } from './application/users/users.service.js';
export { UserNotFoundError } from './domain/exceptions/user.errors.js';
