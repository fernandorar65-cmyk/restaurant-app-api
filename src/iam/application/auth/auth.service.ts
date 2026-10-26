import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { PASSWORD_HASHER } from '../../../common/application/ports/password-hasher.port.js';
import type { PasswordHasher } from '../../../common/application/ports/password-hasher.port.js';
import { PASSWORD_RESET_NOTIFIER } from '../../../common/application/ports/password-reset-notifier.port.js';
import type { PasswordResetNotifier } from '../../../common/application/ports/password-reset-notifier.port.js';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import {
  generateOpaqueToken,
  hashToken,
} from '../../../common/application/security/opaque-token.js';
import { CustomerProfile } from '../../domain/entities/customer-profile.entity.js';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { User } from '../../domain/entities/user.entity.js';
import {
  AccountDisabledError,
  InvalidCredentialsError,
  InvalidPasswordResetTokenError,
  InvalidRefreshTokenError,
} from '../../domain/exceptions/auth.errors.js';
import { DuplicateEmailError } from '../../domain/exceptions/user.errors.js';
import { CUSTOMER_PROFILE_REPOSITORY } from '../../domain/repositories/customer-profile.repository.js';
import type { CustomerProfileRepository } from '../../domain/repositories/customer-profile.repository.js';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../domain/repositories/password-reset-token.repository.js';
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.js';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/repositories/refresh-token.repository.js';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterCustomerInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  dietaryPreferences?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}

interface RefreshTokenPayload {
  sub: string;
  jti: string;
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
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly customerProfileRepository: CustomerProfileRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(PASSWORD_RESET_NOTIFIER)
    private readonly passwordResetNotifier: PasswordResetNotifier,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** Creates the user and its diner profile together. */
  async registerCustomer(
    input: RegisterCustomerInput,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new DuplicateEmailError(existing.email);
    }
    const draft = User.create({
      id: randomUUID(),
      email: input.email,
      passwordHash: await this.passwordHasher.hash(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    });
    const user = await this.transactionRunner.run(async (tx) => {
      const saved = await this.userRepository.save(draft, tx);
      await this.customerProfileRepository.save(
        CustomerProfile.create({
          userId: saved.id,
          dietaryPreferences: input.dietaryPreferences,
        }),
        tx,
      );
      return saved;
    });
    return { user, tokens: await this.issueTokens(user) };
  }

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

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return; // never reveal whether the email exists
    }
    const rawToken = generateOpaqueToken();
    await this.passwordResetTokenRepository.save(
      PasswordResetToken.create({
        id: randomUUID(),
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      }),
    );
    await this.passwordResetNotifier.notify(user.email, rawToken);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const token = await this.passwordResetTokenRepository.findByTokenHash(
      hashToken(rawToken),
    );
    if (!token || !token.isUsable) {
      throw new InvalidPasswordResetTokenError();
    }
    const user = await this.userRepository.findById(token.userId);
    if (!user) {
      throw new InvalidPasswordResetTokenError();
    }
    user.changePasswordHash(await this.passwordHasher.hash(newPassword));
    token.markUsed();
    await this.userRepository.save(user);
    await this.passwordResetTokenRepository.save(token);
  }

  async changeOwnPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const valid = await this.passwordHasher.verify(
      currentPassword,
      user.passwordHash,
    );
    if (!valid) {
      throw new InvalidCredentialsError();
    }
    user.changePasswordHash(await this.passwordHasher.hash(newPassword));
    await this.userRepository.save(user);
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
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(accessToken, { secret: this.accessSecret() });
      return { id: payload.sub, email: payload.email };
    } catch {
      return null;
    }
  }

  /** Opens a session for a user another use case just created (e.g. owner sign-up). */
  startSession(user: User): Promise<AuthTokens> {
    return this.issueTokens(user);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      { secret: this.accessSecret(), expiresIn: ACCESS_TOKEN_TTL },
    );

    const jti = randomUUID();
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, jti } satisfies RefreshTokenPayload,
      { secret: this.refreshSecret(), expiresIn: `${REFRESH_TOKEN_TTL_MS}ms` },
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
  ): Promise<RefreshTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        { secret: this.refreshSecret() },
      );
    } catch {
      throw new InvalidRefreshTokenError();
    }
  }

  // Presence is checked at startup (validateEnvironment); no defaults here.
  private accessSecret(): string {
    return this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  private refreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }
}
