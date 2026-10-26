import { RefreshToken } from '../entities/refresh-token.entity.js';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface RefreshTokenRepository {
  findById(id: string): Promise<RefreshToken | null>;
  save(refreshToken: RefreshToken): Promise<RefreshToken>;
  /**
   * Atomically revokes the token only if it is still active and matches the
   * hash. Returns false when another request already used it, so a refresh
   * token can never be exchanged twice.
   */
  revokeIfActive(id: string, tokenHash: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
