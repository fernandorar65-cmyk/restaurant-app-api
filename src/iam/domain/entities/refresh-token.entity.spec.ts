import { RefreshToken } from './refresh-token.entity.js';

const inOneHour = () => new Date(Date.now() + 60 * 60 * 1000);
const oneHourAgo = () => new Date(Date.now() - 60 * 60 * 1000);

function createToken(expiresAt: Date): RefreshToken {
  return RefreshToken.create({
    id: 'token-1',
    userId: 'user-1',
    tokenHash: 'hash',
    expiresAt,
  });
}

describe('RefreshToken', () => {
  it('is active until it expires', () => {
    const token = createToken(inOneHour());
    expect(token.revokedAt).toBeNull();
    expect(token.isActive).toBe(true);
  });

  it('is not active once expired', () => {
    expect(createToken(oneHourAgo()).isActive).toBe(false);
  });

  it('is not active once revoked', () => {
    const token = createToken(inOneHour());
    token.revoke();
    expect(token.revokedAt).toBeInstanceOf(Date);
    expect(token.isActive).toBe(false);
  });
});
