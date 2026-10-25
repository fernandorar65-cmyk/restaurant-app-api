import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PasswordHasher } from '../../application/ports/password-hasher.port.js';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

@Injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(plain, salt, KEY_LENGTH)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    const [salt, hash] = stored.split(':');
    const hashBuffer = Buffer.from(hash, 'hex');
    const derivedKey = (await scryptAsync(plain, salt, KEY_LENGTH)) as Buffer;
    return (
      derivedKey.length === hashBuffer.length &&
      timingSafeEqual(derivedKey, hashBuffer)
    );
  }
}
