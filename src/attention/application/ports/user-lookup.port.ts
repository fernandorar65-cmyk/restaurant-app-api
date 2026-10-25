export const USER_LOOKUP = Symbol('USER_LOOKUP');

/**
 * Attention's own view of a user, limited to existence. Backed today by an
 * in-process adapter that calls iam's UsersService directly.
 */
export interface UserLookupPort {
  exists(userId: string): Promise<boolean>;
}
