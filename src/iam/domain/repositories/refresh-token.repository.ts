import { RefreshToken } from '../entities/refresh-token.entity.js';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface RefreshTokenRepository {
  findById(id: string): Promise<RefreshToken | null>;
  save(refreshToken: RefreshToken): Promise<RefreshToken>;
  delete(id: string): Promise<boolean>;
}
