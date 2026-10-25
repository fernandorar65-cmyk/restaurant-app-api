import { createHash, randomBytes } from 'node:crypto';

/** Random URL-safe token meant to be shown once and stored only hashed. */
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
