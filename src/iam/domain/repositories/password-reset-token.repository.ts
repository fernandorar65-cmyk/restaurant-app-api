import { PasswordResetToken } from '../entities/password-reset-token.entity.js';

export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol(
  'PASSWORD_RESET_TOKEN_REPOSITORY',
);

export interface PasswordResetTokenRepository {
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  save(token: PasswordResetToken): Promise<PasswordResetToken>;
}
