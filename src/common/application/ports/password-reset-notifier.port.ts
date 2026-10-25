export const PASSWORD_RESET_NOTIFIER = Symbol('PASSWORD_RESET_NOTIFIER');

/**
 * Delivers a password-reset token to its owner (normally by email). No email
 * provider is configured yet, so this is backed today by a stub adapter —
 * swap the binding in each module once one is chosen.
 */
export interface PasswordResetNotifier {
  notify(email: string, rawToken: string): Promise<void>;
}
