import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type {
  AccessTokenClaims,
  RefreshTokenClaims,
  TokenIssuer,
} from '../../application/ports/token-issuer.port.js';

/** JWTs signed with separate secrets for access and refresh tokens. */
@Injectable()
export class JwtTokenIssuer implements TokenIssuer {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(
    claims: AccessTokenClaims,
    expiresInMs: number,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { sub: claims.sub, email: claims.email },
      { secret: this.accessSecret(), expiresIn: `${expiresInMs}ms` },
    );
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenClaims>(
        token,
        { secret: this.accessSecret() },
      );
      return { sub: payload.sub, email: payload.email };
    } catch {
      return null;
    }
  }

  signRefreshToken(
    claims: RefreshTokenClaims,
    expiresInMs: number,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { sub: claims.sub, jti: claims.jti },
      { secret: this.refreshSecret(), expiresIn: `${expiresInMs}ms` },
    );
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenClaims | null> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenClaims>(
        token,
        { secret: this.refreshSecret() },
      );
      return { sub: payload.sub, jti: payload.jti };
    } catch {
      return null;
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
