export const TOKEN_ISSUER = Symbol('IAM_TOKEN_ISSUER');

export interface AccessTokenClaims {
  sub: string;
  email: string;
}

export interface RefreshTokenClaims {
  sub: string;
  /** Id of the stored refresh token, so it can be revoked. */
  jti: string;
}

/**
 * Signs and verifies the session tokens. How long they live is the caller's
 * policy; the format and the secrets are the adapter's.
 */
export interface TokenIssuer {
  signAccessToken(
    claims: AccessTokenClaims,
    expiresInMs: number,
  ): Promise<string>;
  /** Null when the token is malformed, expired or not signed by us. */
  verifyAccessToken(token: string): Promise<AccessTokenClaims | null>;
  signRefreshToken(
    claims: RefreshTokenClaims,
    expiresInMs: number,
  ): Promise<string>;
  /** Null when the token is malformed, expired or not signed by us. */
  verifyRefreshToken(token: string): Promise<RefreshTokenClaims | null>;
}
