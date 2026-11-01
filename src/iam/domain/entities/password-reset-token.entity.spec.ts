import { PasswordResetToken } from './password-reset-token.entity.js';

const inOneHour = () => new Date(Date.now() + 60 * 60 * 1000);
const oneHourAgo = () => new Date(Date.now() - 60 * 60 * 1000);

function createToken(expiresAt: Date): PasswordResetToken {
  return PasswordResetToken.create({
    id: 'token-1',
    userId: 'user-1',
    tokenHash: 'hash',
    expiresAt,
  });
}

describe('PasswordResetToken', () => {
  it('is usable while unused and not expired', () => {
    const token = createToken(inOneHour());
    expect(token.usedAt).toBeNull();
    expect(token.isUsable).toBe(true);
  });

  it('is not usable once expired', () => {
    expect(createToken(oneHourAgo()).isUsable).toBe(false);
  });

  it('can be used only once', () => {
    const token = createToken(inOneHour());
    token.markUsed();
    expect(token.usedAt).toBeInstanceOf(Date);
    expect(token.isUsable).toBe(false);
  });
});
