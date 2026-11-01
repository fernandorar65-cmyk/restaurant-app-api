import type { Actor } from '../../domain/access.js';

export const ACTOR_RESOLVER = Symbol('ACTOR_RESOLVER');

/** Builds the Actor of a user from their active memberships (IAM implements it). */
export interface ActorResolver {
  resolve(userId: string): Promise<Actor>;
}
