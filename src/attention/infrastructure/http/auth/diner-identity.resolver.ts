import { BadRequestException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../../../../iam/application/auth/auth.service.js';
import type { DinerIdentity } from '../../../application/customer-attentions/customer-attentions.service.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Diner routes accept optional login: a valid bearer token identifies the
 * user, otherwise the X-Guest-Token header identifies a guest. An absent or
 * invalid access token never rejects the request; it just means "guest".
 */
@Injectable()
export class DinerIdentityResolver {
  constructor(private readonly authService: AuthService) {}

  async resolve(
    request: Request,
    guestToken: string | undefined,
  ): Promise<DinerIdentity> {
    if (guestToken !== undefined && !UUID_REGEX.test(guestToken)) {
      throw new BadRequestException({
        message: 'X-Guest-Token debe ser un UUID',
        errorCode: 'INVALID_GUEST_TOKEN',
      });
    }
    const user = await this.authService.authenticateBearer(
      request.headers.authorization,
    );
    return { userId: user?.id ?? null, guestToken: guestToken ?? null };
  }
}
