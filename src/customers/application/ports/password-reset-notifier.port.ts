export const PASSWORD_RESET_NOTIFIER = Symbol('PASSWORD_RESET_NOTIFIER');

/**
 * Delivers the password-reset token to the customer (normally by email).
 * No email provider is configured yet, so this is backed today by a stub
 * adapter — swap the binding in customers.module.ts once one is chosen.
 */
export interface PasswordResetNotifier {
  notify(email: string, rawToken: string): Promise<void>;
}
