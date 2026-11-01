import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PASSWORD_HASHER } from '../../../common/application/ports/password-hasher.port.js';
import type { PasswordHasher } from '../../../common/application/ports/password-hasher.port.js';
import { PASSWORD_RESET_NOTIFIER } from '../../../common/application/ports/password-reset-notifier.port.js';
import type { PasswordResetNotifier } from '../../../common/application/ports/password-reset-notifier.port.js';
import {
  generateOpaqueToken,
  hashToken,
} from '../../../common/application/security/opaque-token.js';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity.js';
import {
  InvalidCredentialsError,
  InvalidPasswordResetTokenError,
} from '../../domain/exceptions/auth.errors.js';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../domain/repositories/password-reset-token.repository.js';
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.js';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** Forgotten password (by email) and changing one's own password. */
@Injectable()
export class PasswordsService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(PASSWORD_RESET_NOTIFIER)
    private readonly passwordResetNotifier: PasswordResetNotifier,
  ) {}

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
}
