import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PASSWORD_HASHER } from '../../../common/application/ports/password-hasher.port.js';
import type { PasswordHasher } from '../../../common/application/ports/password-hasher.port.js';
import { Customer } from '../../domain/entities/customer.entity.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import {
  DuplicateCustomerEmailError,
  InvalidCredentialsError,
  InvalidPasswordResetTokenError,
  InvalidRefreshTokenError,
} from '../../domain/exceptions/customer.errors.js';
import { CUSTOMER_REPOSITORY } from '../../domain/repositories/customer.repository.js';
import type { CustomerRepository } from '../../domain/repositories/customer.repository.js';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/repositories/refresh-token.repository.js';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';
import { PASSWORD_RESET_NOTIFIER } from '../../../common/application/ports/password-reset-notifier.port.js';
import type { PasswordResetNotifier } from '../../../common/application/ports/password-reset-notifier.port.js';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  marketingOptIn?: boolean;
}

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
export class CustomersAuthService {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(PASSWORD_RESET_NOTIFIER)
    private readonly passwordResetNotifier: PasswordResetNotifier,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    input: RegisterInput,
  ): Promise<{ customer: Customer; tokens: AuthTokens }> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await this.customerRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new DuplicateCustomerEmailError(normalizedEmail);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const customer = Customer.create({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash,
      marketingOptIn: input.marketingOptIn,
    });
    const saved = await this.customerRepository.save(customer);
    const tokens = await this.issueTokens(saved);
    return { customer: saved, tokens };
  }

  async login(
    input: LoginInput,
  ): Promise<{ customer: Customer; tokens: AuthTokens }> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const customer = await this.customerRepository.findByEmail(normalizedEmail);
    if (!customer) {
      throw new InvalidCredentialsError();
    }
    const valid = await this.passwordHasher.verify(
      input.password,
      customer.passwordHash,
    );
    if (!valid) {
      throw new InvalidCredentialsError();
    }
    const tokens = await this.issueTokens(customer);
    return { customer, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const stored = await this.refreshTokenRepository.findById(payload.jti);
    if (!stored || !stored.isActive || stored.tokenHash !== hashToken(refreshToken)) {
      throw new InvalidRefreshTokenError();
    }
    stored.revoke();
    await this.refreshTokenRepository.save(stored);

    const customer = await this.customerRepository.findById(payload.sub);
    if (!customer) {
      throw new InvalidRefreshTokenError();
    }
    return this.issueTokens(customer);
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
    const customer = await this.customerRepository.findByEmail(normalizedEmail);
    if (!customer) {
      return; // never reveal whether the email exists
    }
    const rawToken = randomBytes(32).toString('hex');
    customer.setPasswordResetToken(
      hashToken(rawToken),
      new Date(Date.now() + RESET_TOKEN_TTL_MS),
    );
    await this.customerRepository.save(customer);
    await this.passwordResetNotifier.notify(customer.email, rawToken);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const customer = await this.customerRepository.findByResetTokenHash(tokenHash);
    if (!customer || !customer.hasValidPasswordResetToken(tokenHash)) {
      throw new InvalidPasswordResetTokenError();
    }
    const passwordHash = await this.passwordHasher.hash(newPassword);
    customer.changePasswordHash(passwordHash);
    customer.clearPasswordResetToken();
    await this.customerRepository.save(customer);
  }

  private async issueTokens(customer: Customer): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(
      { sub: customer.id, email: customer.email },
      { secret: this.accessSecret(), expiresIn: ACCESS_TOKEN_TTL },
    );

    const jti = randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    const refreshToken = await this.jwtService.signAsync(
      { sub: customer.id, jti } satisfies RefreshTokenPayload,
      { secret: this.refreshSecret(), expiresIn: `${REFRESH_TOKEN_TTL_MS}ms` },
    );

    const refreshTokenEntity = RefreshToken.create({
      id: jti,
      customerId: customer.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken };
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
    return this.configService.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret');
  }

  private refreshSecret(): string {
    return this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'dev-refresh-secret',
    );
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
