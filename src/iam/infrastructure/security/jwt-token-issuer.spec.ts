import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';
import { JwtTokenIssuer } from './jwt-token-issuer.js';

const issuer = new JwtTokenIssuer(
  new JwtService({}),
  new ConfigService({
    JWT_ACCESS_SECRET: 'access-secret-for-tests',
    JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  }),
);
const MINUTE = 60 * 1000;

describe('JwtTokenIssuer', () => {
  it('round-trips access and refresh claims', async () => {
    const access = await issuer.signAccessToken(
      { sub: 'u1', email: 'ana@acmr.pe' },
      MINUTE,
    );
    const refresh = await issuer.signRefreshToken(
      { sub: 'u1', jti: 'token-1' },
      MINUTE,
    );

    await expect(issuer.verifyAccessToken(access)).resolves.toEqual({
      sub: 'u1',
      email: 'ana@acmr.pe',
    });
    await expect(issuer.verifyRefreshToken(refresh)).resolves.toEqual({
      sub: 'u1',
      jti: 'token-1',
    });
  });

  it('never accepts one kind of token as the other', async () => {
    const access = await issuer.signAccessToken(
      { sub: 'u1', email: 'ana@acmr.pe' },
      MINUTE,
    );
    const refresh = await issuer.signRefreshToken(
      { sub: 'u1', jti: 'token-1' },
      MINUTE,
    );

    await expect(issuer.verifyRefreshToken(access)).resolves.toBeNull();
    await expect(issuer.verifyAccessToken(refresh)).resolves.toBeNull();
  });

  it('rejects expired and malformed tokens', async () => {
    const expired = await issuer.signAccessToken(
      { sub: 'u1', email: 'ana@acmr.pe' },
      -MINUTE,
    );

    await expect(issuer.verifyAccessToken(expired)).resolves.toBeNull();
    await expect(issuer.verifyAccessToken('not-a-jwt')).resolves.toBeNull();
  });
});
