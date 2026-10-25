import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PASSWORD_HASHER } from '../../../common/application/ports/password-hasher.port.js';
import type { PasswordHasher } from '../../../common/application/ports/password-hasher.port.js';
import { PASSWORD_RESET_NOTIFIER } from '../../../common/application/ports/password-reset-notifier.port.js';
import type { PasswordResetNotifier } from '../../../common/application/ports/password-reset-notifier.port.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { User } from '../../domain/entities/user.entity.js';
import {
  InvalidCredentialsError,
  InvalidPasswordResetTokenError,
  InvalidRefreshTokenError,
} from '../../domain/exceptions/auth.errors.js';
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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

@Injectable()
export class StaffAuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(PASSWORD_RESET_NOTIFIER)
    private readonly passwordResetNotifier: PasswordResetNotifier,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const valid = await this.passwordHasher.verify(input.password, user.passwordHash);
    if (!valid) {
      throw new InvalidCredentialsError();
    }
    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const stored = await this.refreshTokenRepository.findById(payload.jti);
    if (!stored || !stored.isActive || stored.tokenHash !== hashToken(refreshToken)) {
      throw new InvalidRefreshTokenError();
    }
    stored.revoke();
    await this.refreshTokenRepository.save(stored);

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new InvalidRefreshTokenError();
    }
    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken).catch(() => null);
    if (!payload) {
      return;
    }
    const stored = await this.refreshTokenRepository.findById(payload.jti);
    if (stored && stored.isActive) {
      stored.revoke();
      await this.refreshTokenRepository.save(stored);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      return; // never reveal whether the email exists
    }
    const rawToken = randomBytes(32).toString('hex');
    user.setPasswordResetToken(
      hashToken(rawToken),
      new Date(Date.now() + RESET_TOKEN_TTL_MS),
    );
    await this.userRepository.save(user);
    await this.passwordResetNotifier.notify(user.email, rawToken);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const user = await this.userRepository.findByResetTokenHash(tokenHash);
    if (!user || !user.hasValidPasswordResetToken(tokenHash)) {
      throw new InvalidPasswordResetTokenError();
    }
    const passwordHash = await this.passwordHasher.hash(newPassword);
    user.changePasswordHash(passwordHash);
    user.clearPasswordResetToken();
    await this.userRepository.save(user);
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
    const valid = await this.passwordHasher.verify(currentPassword, user.passwordHash);
    if (!valid) {
      throw new InvalidCredentialsError();
    }
    user.changePasswordHash(await this.passwordHasher.hash(newPassword));
    await this.userRepository.save(user);
  }

  async verifyAccessToken(
    accessToken: string,
  ): Promise<{ id: string; email: string } | null> {
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

  private async issueTokens(user: User): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      { secret: this.accessSecret(), expiresIn: ACCESS_TOKEN_TTL },
    );

    const jti = randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, jti } satisfies RefreshTokenPayload,
      { secret: this.refreshSecret(), expiresIn: `${REFRESH_TOKEN_TTL_MS}ms` },
    );

    const refreshTokenEntity = RefreshToken.create({
      id: jti,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new InvalidRefreshTokenError();
    }
  }

  private accessSecret(): string {
    return this.configService.get<string>(
      'STAFF_JWT_ACCESS_SECRET',
      'dev-staff-access-secret',
    );
  }

  private refreshSecret(): string {
    return this.configService.get<string>(
      'STAFF_JWT_REFRESH_SECRET',
      'dev-staff-refresh-secret',
    );
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
