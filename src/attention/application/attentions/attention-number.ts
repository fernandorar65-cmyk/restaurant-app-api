import { randomBytes } from 'node:crypto';

// No 0/O, 1/I: the code is read aloud and typed by staff.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Short human-friendly attention code, e.g. "A-7KX2QF". */
export function generateAttentionNumber(): string {
  const suffix = Array.from(
    randomBytes(6),
    (byte) => ALPHABET[byte % ALPHABET.length],
  ).join('');
  return `A-${suffix}`;
}
