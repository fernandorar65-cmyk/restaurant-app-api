import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PASSWORD_HASHER } from '../../../common/application/ports/password-hasher.port.js';
import type { PasswordHasher } from '../../../common/application/ports/password-hasher.port.js';
import { hashToken } from '../../../common/application/security/opaque-token.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { User } from '../../domain/entities/user.entity.js';
import {
  AccountDisabledError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../../domain/exceptions/auth.errors.js';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/repositories/refresh-token.repository.js';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import { TOKEN_ISSUER } from '../ports/token-issuer.port.js';
import type {
  RefreshTokenClaims,
  TokenIssuer,
} from '../ports/token-issuer.port.js';

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}

/**
 * Authentication for the single user identity. Diners and staff log in with
 * the same account and tokens; what each one may do is decided by their
 * memberships, not by the login endpoint they used.
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_ISSUER) private readonly tokenIssuer: TokenIssuer,
  ) {}

  async login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const valid = await this.passwordHasher.verify(
      input.password,
      user.passwordHash,
    );
    if (!valid) {
      throw new InvalidCredentialsError();
    }
    if (!user.canLogIn) {
      throw new AccountDisabledError();
    }
    user.recordLogin();
    const saved = await this.userRepository.save(user);
    return { user: saved, tokens: await this.issueTokens(saved) };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    // Check-and-revoke in a single statement: of two concurrent refreshes
    // with the same token only one can win.
    const revoked = await this.refreshTokenRepository.revokeIfActive(
      payload.jti,
      hashToken(refreshToken),
    );
    if (!revoked) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.canLogIn) {
      throw new InvalidRefreshTokenError();
    }
    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken).catch(
      () => null,
    );
    if (!payload) {
      return;
    }
    await this.refreshTokenRepository.revokeIfActive(
      payload.jti,
      hashToken(refreshToken),
    );
  }

  /**
   * Public entry point for other contexts and guards: resolves the user of
   * an `Authorization: Bearer <token>` header, or null when it is missing or
   * invalid (callers decide whether that means 401 or "guest").
   */
  async authenticateBearer(
    authorizationHeader: string | undefined,
  ): Promise<AuthenticatedUser | null> {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      return null;
    }
    const token = authorizationHeader.slice('Bearer '.length).trim();
    return token ? this.verifyAccessToken(token) : null;
  }

  async verifyAccessToken(
    accessToken: string,
  ): Promise<AuthenticatedUser | null> {
    const claims = await this.tokenIssuer.verifyAccessToken(accessToken);
    return claims ? { id: claims.sub, email: claims.email } : null;
  }

  /** Opens a session for a user another use case just created (e.g. owner sign-up). */
  startSession(user: User): Promise<AuthTokens> {
    return this.issueTokens(user);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const accessToken = await this.tokenIssuer.signAccessToken(
      { sub: user.id, email: user.email },
      ACCESS_TOKEN_TTL_MS,
    );

    const jti = randomUUID();
    const refreshToken = await this.tokenIssuer.signRefreshToken(
      { sub: user.id, jti },
      REFRESH_TOKEN_TTL_MS,
    );
    await this.refreshTokenRepository.save(
      RefreshToken.create({
        id: jti,
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      }),
    );

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenClaims> {
    const claims = await this.tokenIssuer.verifyRefreshToken(refreshToken);
    if (!claims) {
      throw new InvalidRefreshTokenError();
    }
    return claims;
  }
}
