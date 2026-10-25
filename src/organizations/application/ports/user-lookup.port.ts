export const USER_LOOKUP = Symbol('ORGANIZATIONS_USER_LOOKUP');

/**
 * Organizations' own view of an IAM user, limited to existence (an employee
 * may be linked to a user account).
 */
export interface UserLookupPort {
  exists(userId: string): Promise<boolean>;
}
