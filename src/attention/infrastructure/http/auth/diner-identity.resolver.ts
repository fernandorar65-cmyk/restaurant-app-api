import { BadRequestException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../../../../iam/application/auth/auth.service.js';
import { extractBearerToken } from '../../../../iam/infrastructure/http/guards/auth.guard.js';
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
      throw new BadRequestException('X-Guest-Token must be a UUID');
    }
    const accessToken = extractBearerToken(request);
    const user = accessToken
      ? await this.authService.verifyAccessToken(accessToken)
      : null;
    return { userId: user?.id ?? null, guestToken: guestToken ?? null };
  }
}
