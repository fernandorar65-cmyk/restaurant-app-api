import { Injectable, Logger } from '@nestjs/common';
import { PasswordResetNotifier } from '../../application/ports/password-reset-notifier.port.js';

/**
 * Placeholder adapter: logs the reset token instead of emailing it, since no
 * email provider is configured yet. Replace with a real adapter (e.g. SES,
 * Resend) behind the same port once one is chosen.
 */
@Injectable()
export class ConsolePasswordResetNotifierAdapter implements PasswordResetNotifier {
  private readonly logger = new Logger(ConsolePasswordResetNotifierAdapter.name);

  async notify(email: string, rawToken: string): Promise<void> {
    this.logger.warn(
      `[password-reset placeholder] token for ${email}: ${rawToken}`,
    );
  }
}
